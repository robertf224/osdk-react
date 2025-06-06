import type { ObjectOrInterfaceDefinition, Osdk, PrimaryKeyType } from "@osdk/api";
import memoize from "memoize-one";
import { ArrayOrderedMap, AsyncValue, OrderedMap } from "../utils";
import { OntologyObservation } from "../OntologyObservation";
import { ObjectList } from "../ObjectList";

export type ObjectListObserverSnapshot<T extends ObjectOrInterfaceDefinition> = AsyncValue<{
    objects: Osdk<T>[];
    hasMore: boolean;
}>;

type ObjectListObserverState<T extends ObjectOrInterfaceDefinition> = AsyncValue<{
    data: OrderedMap<PrimaryKeyType<T>, Osdk<T>>;
    nextPageToken?: string;
}>;

export class ObjectListObserver<T extends ObjectOrInterfaceDefinition> {
    #objectList: ObjectList<T>;
    #broadcastObservation: (observation: OntologyObservation) => void;
    #onFirstSubscribe: () => void;
    #onLastUnsubscribe: () => void;

    #subscribers: Set<() => void>;
    #state: ObjectListObserverState<T> | undefined;

    constructor(
        objectList: ObjectList<T>,
        broadcastObservation: (observation: OntologyObservation) => void,
        onFirstSubscribe: () => void,
        onLastUnsubscribe: () => void
    ) {
        this.#objectList = objectList;
        this.#broadcastObservation = broadcastObservation;
        this.#subscribers = new Set();
        this.#onFirstSubscribe = onFirstSubscribe;
        this.#onLastUnsubscribe = onLastUnsubscribe;
    }

    subscribe = (callback: () => void) => {
        this.#subscribers.add(callback);
        if (this.#subscribers.size === 1) {
            this.#onFirstSubscribe();
        }
        return () => {
            this.#subscribers.delete(callback);
            if (this.#subscribers.size === 0) {
                this.#onLastUnsubscribe();
            }
        };
    };

    #notifySubscribers = () => {
        this.#subscribers.forEach((callback) => callback());
    };

    #getSnapshotFromState = memoize(
        (state: ObjectListObserverState<T> | undefined): ObjectListObserverSnapshot<T> | undefined =>
            state
                ? AsyncValue.mapValue(state, ({ data, nextPageToken }) => ({
                      objects: [...data.values()],
                      hasMore: nextPageToken !== undefined,
                  }))
                : undefined
    );
    getSnapshot = (): ObjectListObserverSnapshot<T> | undefined => {
        return this.#getSnapshotFromState(this.#state);
    };

    refresh = async (pageSize?: number) => {
        const promise = this.#objectList.objectSet
            .toOSDK()
            .fetchPage({ $orderBy: this.#objectList.orderBy, $pageSize: pageSize });
        this.#state = { type: "loading", promise };
        const loadingState = this.#state;

        this.#notifySubscribers();

        try {
            const { data, nextPageToken } = await promise;
            if (loadingState !== this.#state) {
                return;
            }

            this.#state = {
                type: "loaded",
                value: {
                    data: new ArrayOrderedMap<PrimaryKeyType<T>, Osdk<T>>(
                        this.#objectList.getComparator(),
                        data.map((object) => ({ key: object.$primaryKey, value: object }))
                    ),
                    nextPageToken,
                },
            };

            this.#notifySubscribers();
            this.#broadcastObservation({
                knownObjects: data.map((object) => object.$as(object.$objectType)),
                deletedObjects: [],
            });
        } catch (error) {
            this.#state = { type: "error", error: error as Error };
            this.#notifySubscribers();
        }
    };

    loadMore = async (pageSize?: number) => {
        if (!this.#state || this.#state.type === "error") {
            console.warn("Called `loadMore` before an initial load.");
            return;
        }
        if (this.#state.type === "loading" || this.#state.type === "reloading") {
            console.warn("Called `loadMore` while there was a pending operation.");
            return;
        }
        if (!this.#state.value.nextPageToken) {
            console.warn("Called `loadMore` on an exhausted list.");
            return;
        }

        const { data, nextPageToken } = this.#state.value;
        const promise = this.#objectList.objectSet.toOSDK().fetchPage({
            $orderBy: this.#objectList.orderBy,
            $pageSize: pageSize,
            $nextPageToken: nextPageToken,
        });
        this.#state = { type: "reloading", value: this.#state.value, promise };
        const loadingState = this.#state;

        this.#notifySubscribers();

        try {
            const { data, nextPageToken } = await promise;
            if (loadingState !== this.#state) {
                return;
            }
            for (const object of data) {
                this.#state.value.data.set(object.$primaryKey, object);
            }
            this.#state = { type: "loaded", value: { data: this.#state.value.data, nextPageToken } };

            this.#notifySubscribers();
            this.#broadcastObservation({
                knownObjects: data.map((object) => object.$as(object.$objectType)),
                deletedObjects: [],
            });
        } catch {
            // TODO: advertise error via a callback passed to loadMore
            this.#state = { type: "loaded", value: { data, nextPageToken } };
            this.#notifySubscribers();
        }
    };

    processObservation = (observation: OntologyObservation) => {
        if (!(this.#state?.type === "loaded" || this.#state?.type === "reloading")) {
            return;
        }

        let dirty = false;
        for (const object of observation.knownObjects) {
            if (this.#objectList.objectSet.contains(object)) {
                const objectSetObject = object.$as(
                    this.#objectList.objectSet.type.apiName
                ) as unknown as Osdk<T>;

                const deleted = this.#state.value.data.delete(objectSetObject.$primaryKey);
                if (deleted) {
                    dirty = true;
                }
                const insertionIndex = this.#state.value.data.findInsertionIndex(
                    objectSetObject.$primaryKey,
                    objectSetObject
                );

                // If we have more data to load and the object would go after all current items,
                // we can't determine the correct position yet.
                if (
                    this.#state.value.nextPageToken !== undefined &&
                    insertionIndex === this.#state.value.data.size
                ) {
                    continue;
                }
                this.#state.value.data.set(objectSetObject.$primaryKey, objectSetObject);
                dirty = true;
            }
        }
        for (const object of observation.deletedObjects) {
            this.#state.value.data.delete(object.primaryKey as PrimaryKeyType<T>);
            dirty = true;
        }

        if (dirty) {
            this.#state = { ...this.#state };
            this.#notifySubscribers();
        }
    };
}
