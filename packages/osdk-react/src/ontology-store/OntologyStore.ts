import type { ObjectOrInterfaceDefinition, WhereClause } from "@osdk/api";
import type { Client } from "@osdk/client";
import {
    ObjectListObserver,
    LiveObjectSetObserver,
    ActionsObserver,
    ObjectListObserverSnapshot,
    LiveObjectSetObserverSnapshot,
} from "./observers";
import { ObjectSet } from "./object-set";
import { ObjectList, ObjectSetOrderBy } from "./ObjectList";
import { LruMap } from "./utils/LruMap";

export interface ObjectListObserverRequest<T extends ObjectOrInterfaceDefinition> {
    type: T;
    where?: WhereClause<T>;
    orderBy: ObjectSetOrderBy<T>;
}

export interface ObjectListObserverResponse<T extends ObjectOrInterfaceDefinition> {
    subscribe: (callback: () => void) => () => void;
    getSnapshot: () => ObjectListObserverSnapshot<T> | undefined;
    loadMore: (pageSize?: number) => void;
    refresh: (pageSize?: number) => void;
}

// TODO: aggregations, queries

export interface LiveObjectSetObserverRequest<T extends ObjectOrInterfaceDefinition> {
    type: T;
    where?: WhereClause<T>;
}

export interface LiveObjectSetObserverResponse {
    subscribe: (callback: () => void) => () => void;
    getSnapshot: () => LiveObjectSetObserverSnapshot | undefined;
    refresh: () => void;
}

export class OntologyStore {
    #client: Client;
    #objectListObservers: Map<string, ObjectListObserver<ObjectOrInterfaceDefinition>>;
    #liveObjectSetObservers: Map<string, LiveObjectSetObserver<ObjectOrInterfaceDefinition>>;
    #objectListReleaseBuffer: LruMap<string, ObjectListObserver<ObjectOrInterfaceDefinition>>;
    #liveObjectSetReleaseBuffer: LruMap<string, LiveObjectSetObserver<ObjectOrInterfaceDefinition>>;
    #actionsObserver: ActionsObserver;

    constructor(client: Client) {
        this.#client = client;
        this.#objectListObservers = new Map();
        this.#liveObjectSetObservers = new Map();
        this.#objectListReleaseBuffer = new LruMap(20);
        this.#liveObjectSetReleaseBuffer = new LruMap(20);
        this.#actionsObserver = new ActionsObserver(client, (observation) => {
            this.#objectListObservers.forEach((otherObserver) =>
                otherObserver.processObservation(observation)
            );
        });
    }

    objectList = <T extends ObjectOrInterfaceDefinition>({
        type,
        where,
        orderBy,
    }: ObjectListObserverRequest<T>): ObjectListObserverResponse<T> => {
        const objectSet = new ObjectSet(this.#client, type, where);
        const objectList = new ObjectList(objectSet, orderBy);
        const key = JSON.stringify(objectList);

        const activeObserver = this.#objectListObservers.get(key) as ObjectListObserver<T> | undefined;
        if (activeObserver) return activeObserver;

        const bufferedObserver = this.#objectListReleaseBuffer.get(key) as ObjectListObserver<T> | undefined;
        if (bufferedObserver) return bufferedObserver;

        const newObserver = new ObjectListObserver(
            objectList,
            (observation) => {
                this.#objectListObservers.forEach((otherObserver) => {
                    if (otherObserver !== newObserver) {
                        otherObserver.processObservation(observation);
                    }
                });
            },
            () => {
                this.#objectListObservers.set(
                    key,
                    newObserver as ObjectListObserver<ObjectOrInterfaceDefinition>
                );
                this.#objectListReleaseBuffer.delete(key);
            },
            () => {
                this.#objectListObservers.delete(key);
                this.#objectListReleaseBuffer.set(
                    key,
                    newObserver as ObjectListObserver<ObjectOrInterfaceDefinition>
                );
            }
        );

        this.#objectListReleaseBuffer.set(
            key,
            newObserver as ObjectListObserver<ObjectOrInterfaceDefinition>
        );

        return newObserver;
    };

    liveObjectSet = <T extends ObjectOrInterfaceDefinition>({
        type,
        where,
    }: LiveObjectSetObserverRequest<T>): LiveObjectSetObserverResponse => {
        const objectSet = new ObjectSet(this.#client, type, where);
        const key = JSON.stringify(objectSet);

        const activeObserver = this.#liveObjectSetObservers.get(key) as LiveObjectSetObserver<T> | undefined;
        if (activeObserver) return activeObserver;

        const bufferedObserver = this.#liveObjectSetReleaseBuffer.get(key) as
            | LiveObjectSetObserver<T>
            | undefined;
        if (bufferedObserver) return bufferedObserver;

        const newObserver = new LiveObjectSetObserver(
            objectSet,
            (observation) => {
                this.#objectListObservers.forEach((otherObserver) =>
                    otherObserver.processObservation(observation)
                );
            },
            () => {
                this.#liveObjectSetObservers.set(
                    key,
                    newObserver as LiveObjectSetObserver<ObjectOrInterfaceDefinition>
                );
                this.#liveObjectSetReleaseBuffer.delete(key);
            },
            () => {
                this.#liveObjectSetObservers.delete(key);
                this.#liveObjectSetReleaseBuffer.set(
                    key,
                    newObserver as LiveObjectSetObserver<ObjectOrInterfaceDefinition>
                );
            }
        );

        this.#liveObjectSetReleaseBuffer.set(
            key,
            newObserver as LiveObjectSetObserver<ObjectOrInterfaceDefinition>
        );

        return newObserver;
    };

    get applyAction(): (...args: Parameters<ActionsObserver["applyAction"]>) => void {
        return (...args) => void this.#actionsObserver.applyAction(...args);
    }
}
