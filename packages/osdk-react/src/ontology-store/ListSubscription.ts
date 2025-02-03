import type { ObjectOrInterfaceDefinition, Osdk } from "@osdk/api";
import type { Client } from "@osdk/client";
import type {
    ListSubscriptionRequest,
    ListSubscriptionSnapshot,
    ObjectSet,
    OntologyObservation,
} from "./types";
import { modernToLegacyWhereClause } from "./modernToLegacyWhereClause";
import { AsyncValue } from "./AsyncValue";
import invariant from "tiny-invariant";

export interface ListSubscription {
    getSnapshot: () => ListSubscriptionSnapshot<ObjectOrInterfaceDefinition>;
    refresh: () => void;
    loadMore: (pageSize?: number) => void;
    cancel: () => void;
    processObservation: (observation: OntologyObservation<ObjectOrInterfaceDefinition>) => void;
}

export function ListSubscription<T extends ObjectOrInterfaceDefinition>(
    client: Client,
    { type, $where, $orderBy, $pageSize, callback }: ListSubscriptionRequest<T>,
    broadcastObservation: (observation: OntologyObservation<T>) => void
): ListSubscription {
    const filter = $where ? modernToLegacyWhereClause($where, type) : undefined;
    const objectSet: ObjectSet<T> = { type, filter };

    let state:
        | AsyncValue<{
              data: Osdk<T>[];
              nextPageToken?: string;
          }>
        | undefined;

    // TODO: clean up this caching
    let cache: { state: typeof state; snapshot: ListSubscriptionSnapshot<ObjectOrInterfaceDefinition> };
    const getSnapshot = (): ListSubscriptionSnapshot<ObjectOrInterfaceDefinition> => {
        invariant(state, "Called `getSnapshot` after subscription was canceled.");
        if (state === cache.state) {
            return cache.snapshot;
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

        callback(getSnapshot());

        try {
            const { data, nextPageToken } = await promise;
            if (promise !== AsyncValue.getPromise(state)) {
                return;
            }
            state = { type: "loaded", value: { data, nextPageToken } };
            broadcastObservation({
                type: "loaded-objects",
                objectSet,
                objects: data,
                orderBy: $orderBy,
            });
        } catch {
            state = undefined;
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

        callback(getSnapshot());

        try {
            const { data, nextPageToken } = await promise;
            if (promise !== AsyncValue.getPromise(state)) {
                return;
            }
            state = { type: "loaded", value: { data, nextPageToken } };

            callback(getSnapshot());
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
            callback(getSnapshot());
        }
    };

    const cancel = () => {
        state = undefined;
    };

    const processObservation = (observation: OntologyObservation<ObjectOrInterfaceDefinition>) => {
        // TODO: process observations!
        console.log(JSON.stringify(objectSet), `Processing observation...`, JSON.stringify(observation));
    };

    void refresh();

    return {
        getSnapshot,
        refresh: () => void refresh(),
        loadMore: (pageSize) => void loadMore(pageSize),
        cancel,
        processObservation,
    };
}
