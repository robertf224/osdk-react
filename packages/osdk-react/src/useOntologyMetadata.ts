"use client";

import React from "react";
import { Client } from "@osdk/client";
import { useOsdkContext } from "./OsdkContext";

export function useOntologyMetadata<T extends Parameters<Client["fetchMetadata"]>[0]>(
    type: T
): NonNullable<T["__DefinitionMetadata"]> {
    const { store } = useOsdkContext();

    const observer = store.metadata(type);
    let snapshot = React.useSyncExternalStore(observer.subscribe, observer.getSnapshot);

    if (!snapshot) {
        void observer.refresh();
        snapshot = observer.getSnapshot()!;
    }

    if (snapshot.type === "loading") {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw snapshot.promise;
    } else if (snapshot.type === "error") {
        throw snapshot.error;
    }

    return snapshot.value.data;
}
