import type { ObjectOrInterfaceDefinition, Osdk, ObjectSet as ObjectSetClient } from "@osdk/api";
import memoize from "memoize-one";
import type { ListObserverSnapshot, ObjectSet, OntologyObservation, ObjectSetOrderBy } from "./types";
import { AsyncValue } from "./AsyncValue";

export interface ListObserver<T extends ObjectOrInterfaceDefinition> {
    subscribe: (callback: () => void) => () => void;
    getSnapshot: () => ListObserverSnapshot<T> | undefined;
    refresh: (pageSize?: number) => void;
    loadMore: (pageSize?: number) => void;
    processObservation: (observation: OntologyObservation<ObjectOrInterfaceDefinition>) => void;
}

export function ListObserver<T extends ObjectOrInterfaceDefinition>(
    client: ObjectSetClient<T>,
    objectSet: ObjectSet<T>,
    orderBy: ObjectSetOrderBy<T>,
    broadcastObservation: (observation: OntologyObservation<T>) => void
): ListObserver<T> {
    let state:
        | AsyncValue<{
              data: Osdk<T>[];
              nextPageToken?: string;
          }>
        | undefined;

    const subscribers = new Set<() => void>();
    const subscribe = (callback: () => void) => {
        subscribers.add(callback);
        return () => {
            subscribers.delete(callback);
        };
    };
    const notifySubscribers = () => {
        subscribers.forEach((callback) => callback());
    };

    const getSnapshotFromState = memoize((s: typeof state) =>
        s
            ? AsyncValue.mapValue(s, ({ data, nextPageToken }) => ({
                  objects: data,
                  hasMore: nextPageToken !== undefined,
              }))
            : undefined
    );
    const getSnapshot = (): ListObserverSnapshot<T> | undefined => {
        return getSnapshotFromState(state);
    };

    const refresh = async (pageSize?: number) => {
        const promise = client.fetchPage({ $orderBy: orderBy, $pageSize: pageSize });
        state = { type: "loading", promise };
        const loadingState = state;

        notifySubscribers();

        try {
            const { data, nextPageToken } = await promise;
            if (loadingState !== state) {
                return;
            }

            state = { type: "loaded", value: { data, nextPageToken } };

            notifySubscribers();
            broadcastObservation({
                type: "loaded-objects",
                objectSet,
                objects: data,
                orderBy,
            });
        } catch (error) {
            state = { type: "error", error: error as Error };
            notifySubscribers();
        }
    };

    const loadMore = async (pageSize?: number) => {
        if (!state || state.type === "error") {
            console.warn("Called `loadMore` before an initial load.");
            return;
        }
        if (state.type === "loading" || state.type === "reloading") {
            console.warn("Called `loadMore` while there was a pending operation.");
            return;
        }
        if (!state.value.nextPageToken) {
            console.warn("Called `loadMore` on an exhausted list.");
            return;
        }

        const { data, nextPageToken } = state.value;
        const promise = client
            .fetchPage({ $orderBy: orderBy, $pageSize: pageSize, $nextPageToken: nextPageToken })
            .then((page) => ({ data: [...data, ...page.data], nextPageToken: page.nextPageToken }));
        state = { type: "reloading", value: state.value, promise };
        const loadingState = state;

        notifySubscribers();

        try {
            const { data, nextPageToken } = await promise;
            if (loadingState !== state) {
                return;
            }
            state = { type: "loaded", value: { data, nextPageToken } };

            notifySubscribers();
            broadcastObservation({
                type: "loaded-objects",
                objectSet,
                objects: data,
                orderBy,
                afterPrimaryKey: data[data.length - 1]?.$primaryKey,
            });
        } catch {
            // TODO: advertise error via a callback passed to loadMore
            state = { type: "loaded", value: { data, nextPageToken } };
            notifySubscribers();
        }
    };

    const processObservation = (observation: OntologyObservation<ObjectOrInterfaceDefinition>) => {
        // TODO: process observations!
        console.log(JSON.stringify(objectSet), `Processing observation...`, JSON.stringify(observation));
    };

    return {
        subscribe,
        getSnapshot,
        refresh: () => void refresh(),
        loadMore: (pageSize) => void loadMore(pageSize),
        processObservation,
    };
}
