import type { ObjectOrInterfaceDefinition, ActionDefinition } from "@osdk/api";
import type { Client } from "@osdk/client";
import type { ListObserverRequest, ListObserverResponse } from "./types";
import { ListObserver } from "./ListObserver";

export interface OntologyStore {
    list<T extends ObjectOrInterfaceDefinition>(request: ListObserverRequest<T>): ListObserverResponse;
    applyAction<T extends ActionDefinition>(type: T): Promise<void>;
}

export function OntologyStore(client: Client): OntologyStore {
    const listObservers = new Set<ListObserver>();

    const list = <T extends ObjectOrInterfaceDefinition>(
        request: ListObserverRequest<T>
    ): ListObserverResponse => {
        let canceled = false;
        // TODO: filter out our own observations
        const observer = ListObserver(client, request, (observation) => {
            if (canceled) {
                return;
            }
            listObservers.forEach((observer) => {
                observer.processObservation(observation);
            });
        });
        listObservers.add(observer);
        return {
            subscribe: observer.subscribe,
            getSnapshot: observer.getSnapshot,
            loadMore: observer.loadMore,
            refresh: observer.refresh,
            dispose: () => {
                canceled = true;
                listObservers.delete(observer);
            },
        };
    };

    return {
        list,
        applyAction: () => {
            throw new Error("Not implemented.");
        },
    };
}
