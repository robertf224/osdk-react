"use client";

import React from "react";
import type { ObjectOrInterfaceDefinition, WhereClause } from "@osdk/api";
import { useOsdkContext } from "./OsdkContext";

export function useLiveObjectSet<T extends ObjectOrInterfaceDefinition>(
    type: T,
    opts?: {
        $where?: WhereClause<T>;
    }
): void {
    const { store } = useOsdkContext();

    const observer = store.liveObjectSet({ type, where: opts?.$where });
    let snapshot = React.useSyncExternalStore(observer.subscribe, observer.getSnapshot);

    if (!snapshot) {
        observer.refresh();
        snapshot = observer.getSnapshot()!;
    }
}
