import { ActionDefinition } from "@osdk/api";
import { useOsdkContext } from "./OsdkContext";
import React from "react";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type UseAction<T extends ActionDefinition> = [
    isPending: boolean,
    // TODO: get typings from OSDK upstream exported
    apply: (parameters: Record<string, unknown>) => void,
];

export function useAction<T extends ActionDefinition>(
    type: T,
    opts?: {
        onCompleted?: () => void;
        onError?: (error: Error) => void;
    }
): UseAction<T> {
    const { store } = useOsdkContext();
    const [isPending, setIsPending] = React.useState(false);

    const apply = (parameters: Record<string, unknown>) => {
        setIsPending(true);
        store.applyAction(type, parameters, {
            onCompleted: () => {
                setIsPending(false);
                opts?.onCompleted?.();
            },
            onError: (error) => {
                setIsPending(false);
                opts?.onError?.(error);
            },
        });
    };

    return [isPending, apply];
}
