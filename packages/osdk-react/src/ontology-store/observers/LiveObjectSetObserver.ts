import { ObjectOrInterfaceDefinition } from "@osdk/api";
import { ObjectSet } from "../object-set";
import { OntologyObservation } from "../OntologyObservation";
import invariant from "tiny-invariant";

// TODO: try to coalesce w/ AsyncValue
export type LiveObjectSetObserverSnapsot = { status: "connecting" | "connected" | "error"; error?: Error };

export class LiveObjectSetObserver<T extends ObjectOrInterfaceDefinition> {
    #objectSet: ObjectSet<T>;
    #broadcastObservation: (observation: OntologyObservation) => void;

    #subscribers: Set<() => void>;
    #watcherSubscription: { unsubscribe: () => void } | undefined;
    #state: LiveObjectSetObserverSnapsot | undefined;

    constructor(objectSet: ObjectSet<T>, broadcastObservation: (observation: OntologyObservation) => void) {
        // We only allow live object sets with no filters for now so that we can understand when objects are
        // actually deleted. This should be upstreamed into OSW, and then we can remove this invariant.
        invariant(!objectSet.hasFilter, "Filters are not currently allowed for live Object Sets.");
        this.#objectSet = objectSet;
        this.#broadcastObservation = broadcastObservation;
        this.#subscribers = new Set();
    }

    subscribe = (callback: () => void) => {
        this.#subscribers.add(callback);
        return () => this.#subscribers.delete(callback);
    };

    #notifySubscribers = () => {
        this.#subscribers.forEach((callback) => callback());
    };

    getSnapshot = () => this.#state;

    refresh = () => {
        this.#watcherSubscription?.unsubscribe();
        this.#state = { ...this.#state, status: "connecting" };
        this.#notifySubscribers();
        this.#watcherSubscription = this.#objectSet.toOSDK().subscribe({
            onSuccessfulSubscription: () => {
                this.#state = { status: "connected" };
                this.#notifySubscribers();
            },
            onError: (error) => {
                this.#state = { status: "error", error: error.error as Error };
                this.#notifySubscribers();
            },
            onChange: (change) => {
                this.#broadcastObservation({
                    knownObjects:
                        change.state === "ADDED_OR_UPDATED"
                            ? [change.object.$as(change.object.$objectType)]
                            : [],
                    deletedObjects:
                        change.state === "REMOVED"
                            ? [
                                  {
                                      objectType: change.object.$objectType,
                                      primaryKey: change.object.$primaryKey,
                                  },
                              ]
                            : [],
                });
            },
        });
    };
}
