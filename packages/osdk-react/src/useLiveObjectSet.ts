"use client";

import React from "react";
import type { ObjectOrInterfaceDefinition, ObjectSet } from "@osdk/api";
import { useQueryClient } from "@tanstack/react-query";
import { useOsdkContext } from "./OsdkContext";
import { updateObjectsQueries } from "./useObjects";
import { updateObjectQueries } from "./useObject";
import { OntologyObservation } from "./ontology";

export type LiveObjectSetState = { status: "connecting" | "connected" | "error"; error?: Error };

export function useLiveObjectSet<T extends ObjectOrInterfaceDefinition>(type: T): LiveObjectSetState {
    const { client } = useOsdkContext();
    const queryClient = useQueryClient();
    const [state, setState] = React.useState<LiveObjectSetState>({
        status: "connecting",
    });
    React.useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const objectSet = client(type as any) as ObjectSet<T>;
        const subscription = objectSet.subscribe({
            onSuccessfulSubscription: () => {
                setState({ status: "connected" });
            },
            onError: (error) => {
                setState({ status: "error", error: error.error as Error });
            },
            onChange: (change) => {
                setState({ status: "connected" });
                const ontologyObservation: OntologyObservation = {
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
                };
                updateObjectQueries(queryClient, ontologyObservation);
                updateObjectsQueries(queryClient, ontologyObservation);
            },
        });
        return subscription.unsubscribe;
    }, [client]);
    return state;
}
