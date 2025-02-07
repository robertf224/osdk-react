import type { ObjectOrInterfaceDefinition, WhereClause } from "@osdk/api";
import type { Client } from "@osdk/client";
import {
    ObjectListObserver,
    LiveObjectSetObserver,
    ActionsObserver,
    ObjectListObserverSnapshot,
    LiveObjectSetObserverSnapsot,
} from "./observers";
import { ObjectSet } from "./object-set";
import { ObjectList, ObjectSetOrderBy } from "./ObjectList";

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
    getSnapshot: () => LiveObjectSetObserverSnapsot | undefined;
    refresh: () => void;
}

export class OntologyStore {
    #client: Client;
    #objectListObservers: Map<string, ObjectListObserver<ObjectOrInterfaceDefinition>>;
    #liveObjectSetObservers: Map<string, LiveObjectSetObserver<ObjectOrInterfaceDefinition>>;
    #actionsObserver: ActionsObserver;

    constructor(client: Client) {
        this.#client = client;
        this.#objectListObservers = new Map();
        this.#liveObjectSetObservers = new Map();
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

        const existingObserver = this.#objectListObservers.get(JSON.stringify(objectList)) as
            | ObjectListObserver<T>
            | undefined;
        if (existingObserver) {
            return {
                subscribe: existingObserver.subscribe,
                getSnapshot: existingObserver.getSnapshot,
                loadMore: (...args) => void existingObserver.loadMore(...args),
                refresh: (...args) => void existingObserver.refresh(...args),
            };
        }

        const observer = new ObjectListObserver(objectList, (observation) => {
            this.#objectListObservers.forEach((otherObserver) => {
                if (otherObserver !== observer) {
                    otherObserver.processObservation(observation);
                }
            });
        });
        this.#objectListObservers.set(
            JSON.stringify(objectList),
            observer as ObjectListObserver<ObjectOrInterfaceDefinition>
        );

        return observer;
    };

    liveObjectSet = <T extends ObjectOrInterfaceDefinition>({
        type,
        where,
    }: LiveObjectSetObserverRequest<T>): LiveObjectSetObserverResponse => {
        const objectSet = new ObjectSet(this.#client, type, where);

        const existingObserver = this.#liveObjectSetObservers.get(JSON.stringify(objectSet));
        if (existingObserver) {
            return existingObserver;
        }

        const observer = new LiveObjectSetObserver(objectSet, (observation) => {
            this.#objectListObservers.forEach((otherObserver) =>
                otherObserver.processObservation(observation)
            );
        });
        this.#liveObjectSetObservers.set(
            JSON.stringify(objectSet),
            observer as LiveObjectSetObserver<ObjectOrInterfaceDefinition>
        );

        return observer;
    };

    get applyAction(): (...args: Parameters<ActionsObserver["applyAction"]>) => void {
        return (...args) => void this.#actionsObserver.applyAction(...args);
    }
}
