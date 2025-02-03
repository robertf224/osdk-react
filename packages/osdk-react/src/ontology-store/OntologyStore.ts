import type { ObjectOrInterfaceDefinition, ActionDefinition } from "@osdk/api";
import type { Client } from "@osdk/client";
import type { ListSubscriptionRequest, ListSubscriptionResponse } from "./types";
import { ListSubscription } from "./ListSubscription";

export interface OntologyStore {
    requestListSubscription<T extends ObjectOrInterfaceDefinition>(
        request: ListSubscriptionRequest<T>
    ): ListSubscriptionResponse;
    applyAction<T extends ActionDefinition>(type: T): Promise<void>;
}

export function OntologyStore(client: Client): OntologyStore {
    const listSubscriptions = new Set<ListSubscription>();

    const requestListSubscription = <T extends ObjectOrInterfaceDefinition>(
        request: ListSubscriptionRequest<T>
    ): ListSubscriptionResponse => {
        const subscription = ListSubscription(client, request, (observation) => {
            listSubscriptions.forEach((s) => s.processObservation(observation));
        });
        listSubscriptions.add(subscription);
        return {
            loadMore: subscription.loadMore,
            refresh: subscription.refresh,
            dispose: () => {
                subscription.cancel();
                listSubscriptions.delete(subscription);
            },
        };
    };

    return {
        requestListSubscription,
        applyAction: () => {
            throw new Error("Not implemented.");
        },
    };
}
