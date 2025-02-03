import type { ObjectOrInterfaceDefinition, Osdk } from "@osdk/api";
import type { Client } from "@osdk/client";
import type { ListSubscriptionRequest, ObjectSet, ObjectSetChange } from "./types";
import { modernToLegacyWhereClause } from "./modernToLegacyWhereClause";

export interface ListSubscription {
    refresh: () => void;
    loadMore: (pageSize: number) => void;
    cancel: () => void;
    processChange: (change: ObjectSetChange<ObjectOrInterfaceDefinition>) => void;
}

export function ListSubscription<T extends ObjectOrInterfaceDefinition>(
    client: Client,
    { type, $where, $orderBy, $pageSize, callback }: ListSubscriptionRequest<T>,
    broadcastChange: (change: ObjectSetChange<T>) => void
): ListSubscription {
    const filter = $where ? modernToLegacyWhereClause($where, type) : undefined;
    const objectSet: ObjectSet<T> = { type, filter };

    const state: {
        pendingOperation?: Promise<unknown>;
        objects?: Osdk<T>[];
        nextPageToken?: string;
    } = {};

    const refresh = async () => {
        const promise = client(type)
            .where($where ?? {})
            .fetchPage({ $orderBy, $pageSize });
        state.pendingOperation = promise;

        callback({
            data: promise.then((page) => ({ objects: page.data, hasMore: page.nextPageToken !== undefined })),
            isLoadingMore: false,
        });

        try {
            const { data, nextPageToken } = await promise;
            if (promise !== state.pendingOperation) {
                return;
            }
            state.pendingOperation = undefined;
            state.objects = data;
            state.nextPageToken = nextPageToken;
            broadcastChange({
                objectSet,
                updated: {
                    objects: data,
                    listMetadata: {
                        orderBy: $orderBy,
                    },
                },
            });
        } catch {
            state.pendingOperation = undefined;
        }
    };

    const loadMore = async (pageSize: number) => {
        if (state.pendingOperation) {
            console.warn("Called `loadMore` while there was a pending operation.");
            return;
        }
        const loadedObjects = state.objects;
        if (!loadedObjects) {
            console.warn("Called `loadMore` before an initial load.");
            return;
        }
        if (!state.nextPageToken) {
            console.warn("Called `loadMore` on an exhausted list.");
            return;
        }

        const promise = client(type)
            .where($where ?? {})
            .fetchPage({ $orderBy, $pageSize: pageSize, $nextPageToken: state.nextPageToken });
        state.pendingOperation = promise;

        const snapshotData = promise.then((page) => ({
            objects: [...loadedObjects, ...page.data],
            hasMore: page.nextPageToken !== undefined,
        }));
        callback({
            data: snapshotData,
            isLoadingMore: true,
        });

        try {
            const { data, nextPageToken } = await promise;
            if (promise !== state.pendingOperation) {
                return;
            }
            state.pendingOperation = undefined;
            state.objects = [...loadedObjects, ...data];
            state.nextPageToken = nextPageToken;

            callback({
                data: snapshotData,
                isLoadingMore: false,
            });
            broadcastChange({
                objectSet,
                updated: {
                    objects: data,
                    listMetadata: {
                        orderBy: $orderBy,
                        afterPrimaryKey: loadedObjects[loadedObjects.length - 1]?.$primaryKey,
                    },
                },
            });
        } catch {
            state.pendingOperation = undefined;
        }
    };

    const cancel = () => {
        state.pendingOperation = undefined;
    };

    const processChange = (change: ObjectSetChange<ObjectOrInterfaceDefinition>) => {
        // TODO: process changes!
        console.log(JSON.stringify(objectSet), `Processing change...`, JSON.stringify(change));
    };

    void refresh();

    return {
        refresh: () => void refresh(),
        loadMore: (pageSize) => void loadMore(pageSize),
        cancel,
        processChange,
    };
}
