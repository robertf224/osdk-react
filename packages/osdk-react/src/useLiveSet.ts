"use client";

import React from "react";
import type { ObjectOrInterfaceDefinition, WhereClause } from "@osdk/api";
import { useOsdkContext } from "./OsdkContext";

export function useLiveSet<T extends ObjectOrInterfaceDefinition>(
    type: ObjectOrInterfaceDefinition,
    opts: {
        $where?: WhereClause<T>;
    }
): void {
    const { store } = useOsdkContext();
    const { $where } = opts;

    const observer = store.liveSet({ type, where: $where });
    let snapshot = React.useSyncExternalStore(observer.subscribe, observer.getSnapshot);

    if (!snapshot) {
        observer.refresh();
        snapshot = observer.getSnapshot()!;
    }
}
