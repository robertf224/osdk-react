import type { ActionDefinition } from "@osdk/api";
import { useOsdkContext } from "./OsdkContext";
import React from "react";
import { ActionParameters, ActionEdits } from "./ontology-store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UseAction<T extends ActionDefinition<any>> = [
    applyAction: (
        parameters: ActionParameters<T>,
        opts?: {
            onCompleted?: (edits: ActionEdits) => void;
            onError?: (error: Error) => void;
        }
    ) => void,
    isPending: boolean,
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useAction<T extends ActionDefinition<any>>(type: T): UseAction<T> {
    const { store } = useOsdkContext();
    const [isPending, setIsPending] = React.useState(false);

    const applyAction: UseAction<T>[0] = (parameters, opts) => {
        setIsPending(true);
        store.applyAction(type, parameters, {
            onCompleted: (edits) => {
                setIsPending(false);
                opts?.onCompleted?.(edits);
            },
            onError: (error) => {
                setIsPending(false);
                opts?.onError?.(error);
            },
        });
    };

    return [applyAction, isPending];
}
