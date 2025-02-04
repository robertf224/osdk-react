import type { ObjectOrInterfaceDefinition, ActionDefinition } from "@osdk/api";
import type { Client } from "@osdk/client";
import {
    LiveSetObserverRequest,
    LiveSetObserverResponse,
    ObjectSetReference,
    type ListObserverRequest,
    type ListObserverResponse,
    type ObjectSet,
} from "./types";
import { ListObserver } from "./ListObserver";
import { modernToLegacyWhereClause } from "./modernToLegacyWhereClause";
import { DeepMap } from "./DeepMap";
import { LiveSetObserver } from "./LiveSetObserver";

export interface OntologyStore {
    list<T extends ObjectOrInterfaceDefinition>(request: ListObserverRequest<T>): ListObserverResponse<T>;
    liveSet<T extends ObjectOrInterfaceDefinition>(
        request: LiveSetObserverRequest<T>
    ): LiveSetObserverResponse<T>;
    applyAction<T extends ActionDefinition>(type: T): Promise<void>;
}

export function OntologyStore(client: Client): OntologyStore {
    const listObservers = new DeepMap<ObjectSetReference, ListObserver<ObjectOrInterfaceDefinition>>();
    const liveSetObservers = new DeepMap<ObjectSetReference, LiveSetObserver<ObjectOrInterfaceDefinition>>();

    const list = <T extends ObjectOrInterfaceDefinition>({
        type,
        where,
        orderBy,
    }: ListObserverRequest<T>): ListObserverResponse<T> => {
        const filter = where ? modernToLegacyWhereClause(where, type) : undefined;
        const objectSetReference: ObjectSetReference = { type: type.apiName, filter };

        const existingObserver = listObservers.get(objectSetReference);
        if (existingObserver) {
            return existingObserver as ListObserverResponse<T>;
        }

        const objectSet: ObjectSet<T> = { type, filter };
        const objectSetClient = where ? client(type).where(where) : client(type);
        const observer = ListObserver(objectSetClient, objectSet, orderBy, (observation) => {
            listObservers.forEach((otherObserver) => {
                if (otherObserver !== observer) {
                    otherObserver.processObservation(observation);
                }
            });
        });
        listObservers.set(objectSetReference, observer);

        return observer;
    };

    const liveSet = <T extends ObjectOrInterfaceDefinition>({
        type,
        where,
    }: LiveSetObserverRequest<T>): LiveSetObserverResponse<T> => {
        // TODO: dedupe this code w/ above
        const filter = where ? modernToLegacyWhereClause(where, type) : undefined;
        const objectSetReference: ObjectSetReference = { type: type.apiName, filter };

        const existingObserver = liveSetObservers.get(objectSetReference);
        if (existingObserver) {
            return existingObserver as LiveSetObserverResponse<T>;
        }

        const objectSet: ObjectSet<T> = { type, filter };
        const objectSetClient = where ? client(type).where(where) : client(type);
        const observer = LiveSetObserver(objectSetClient, objectSet, (observation) => {
            listObservers.forEach((otherObserver) => otherObserver.processObservation(observation));
        });
        liveSetObservers.set(objectSetReference, observer);

        return observer;
    };

    return {
        list,
        liveSet,
        applyAction: () => {
            throw new Error("Not implemented.");
        },
    };
}
