import { ObjectOrInterfaceDefinition, ObjectSet as ObjectSetClient } from "@osdk/api";
import { ObjectSetChangeObservation, ObjectSet, LiveSetObserverSnapsot } from "./types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface LiveSetObserver<T extends ObjectOrInterfaceDefinition> {
    subscribe: (callback: () => void) => () => void;
    getSnapshot: () => LiveSetObserverSnapsot | undefined;
    refresh: () => void;
}

export function LiveSetObserver<T extends ObjectOrInterfaceDefinition>(
    client: ObjectSetClient<T>,
    objectSet: ObjectSet<T>,
    broadcastObservation: (observation: ObjectSetChangeObservation<T>) => void
): LiveSetObserver<T> {
    let watcherSubscription: { unsubscribe: () => void } | undefined;
    let state: LiveSetObserverSnapsot | undefined;

    const subscribers = new Set<() => void>();
    const subscribe = (callback: () => void) => {
        subscribers.add(callback);
        return () => {
            subscribers.delete(callback);
        };
    };
    const notifySubscribers = () => {
        subscribers.forEach((callback) => callback());
    };

    const getSnapshot = () => state;

    const refresh = () => {
        watcherSubscription?.unsubscribe();
        state = { ...state, status: "connecting" };
        notifySubscribers();
        watcherSubscription = client.subscribe({
            onSuccessfulSubscription: () => {
                state = { status: "connected" };
                notifySubscribers();
            },
            onError: (error) => {
                state = { status: "error", error: error.error as Error };
                notifySubscribers();
            },
            onChange: (change) => {
                let changeType: "added-or-updated" | "removed";
                if (change.state === "ADDED_OR_UPDATED") {
                    changeType = "added-or-updated";
                } else if (change.state === "REMOVED") {
                    changeType = "removed";
                } else {
                    throw new Error(`Unexpected change type ${change.state as string}`);
                }
                broadcastObservation({
                    type: "object-set-change",
                    objectSet,
                    change: changeType,
                    object: change.object,
                });
            },
        });
    };

    return {
        subscribe,
        getSnapshot,
        refresh,
    };
}
