import type { ObjectOrInterfaceDefinition, Osdk } from "@osdk/api";
import type { Client } from "@osdk/client";
import type { ListObserverSnapshot, ListObserverRequest, ObjectSet, OntologyObservation } from "./types";
import { modernToLegacyWhereClause } from "./modernToLegacyWhereClause";
import { AsyncValue } from "./AsyncValue";

export interface ListObserver {
    subscribe: (callback: () => void) => () => void;
    getSnapshot: () => ListObserverSnapshot<ObjectOrInterfaceDefinition> | undefined;
    refresh: () => void;
    loadMore: (pageSize?: number) => void;
    processObservation: (observation: OntologyObservation<ObjectOrInterfaceDefinition>) => void;
}

export function ListObserver<T extends ObjectOrInterfaceDefinition>(
    client: Client,
    { type, $where, $orderBy, $pageSize }: ListObserverRequest<T>,
    broadcastObservation: (observation: OntologyObservation<T>) => void
): ListObserver {
    const subscribers = new Set<() => void>();

    const filter = $where ? modernToLegacyWhereClause($where, type) : undefined;
    const objectSet: ObjectSet<T> = { type, filter };

    let state:
        | AsyncValue<{
              data: Osdk<T>[];
              nextPageToken?: string;
          }>
        | undefined;

    const notify = () => {
        subscribers.forEach((callback) => callback());
    };

    const subscribe = (callback: () => void) => {
        subscribers.add(callback);
        return () => {
            subscribers.delete(callback);
        };
    };

    // TODO: clean up this caching
    let cache: {
        state: typeof state;
        snapshot: ListObserverSnapshot<ObjectOrInterfaceDefinition> | undefined;
    } = {};
    const getSnapshot = (): ListObserverSnapshot<ObjectOrInterfaceDefinition> | undefined => {
        if (state === cache.state) {
            return cache.snapshot;
        }
        if (!state) {
            return undefined;
        }
        const snapshot = AsyncValue.mapValue(state, ({ data, nextPageToken }) => ({
            objects: data,
            hasMore: nextPageToken !== undefined,
        }));
        cache = { state, snapshot };
        return snapshot;
    };

    const refresh = async () => {
        const promise = client(type)
            .where($where ?? {})
            .fetchPage({ $orderBy, $pageSize });
        state = { type: "loading", promise };

        notify();

        try {
            const { data, nextPageToken } = await promise;
            if (promise !== AsyncValue.getPromise(state)) {
                return;
            }

            state = { type: "loaded", value: { data, nextPageToken } };

            notify();
            broadcastObservation({
                type: "loaded-objects",
                objectSet,
                objects: data,
                orderBy: $orderBy,
            });
        } catch {
            state = undefined;
            notify();
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
        const promise = client(type)
            .where($where ?? {})
            .fetchPage({ $orderBy, $pageSize: pageSize, $nextPageToken: nextPageToken })
            .then((page) => ({ data: [...data, ...page.data], nextPageToken: page.nextPageToken }));
        state = { type: "reloading", value: state.value, promise };

        notify();

        try {
            const { data, nextPageToken } = await promise;
            if (promise !== AsyncValue.getPromise(state)) {
                return;
            }
            state = { type: "loaded", value: { data, nextPageToken } };

            notify();
            broadcastObservation({
                type: "loaded-objects",
                objectSet,
                objects: data,
                orderBy: $orderBy,
                afterPrimaryKey: data[data.length - 1]?.$primaryKey,
            });
        } catch {
            // TODO: advertise error via a callback passed to loadMore
            state = { type: "loaded", value: { data, nextPageToken } };
            notify();
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
