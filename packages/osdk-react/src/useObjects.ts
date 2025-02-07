"use client";

import type { ObjectOrInterfaceDefinition, Osdk, WhereClause } from "@osdk/api";
import { ObjectSetOrderBy } from "./ontology-store";
import { useOsdkContext } from "./OsdkContext";
import React from "react";

export interface UseObjects<T extends ObjectOrInterfaceDefinition> {
    objects: Osdk<T>[];
    hasMore: boolean;
    isLoadingMore: boolean;
    loadMore: (pageSize?: number) => void;
    refresh: () => void;
}

export function useObjects<T extends ObjectOrInterfaceDefinition>(
    type: T,
    opts: {
        $where?: WhereClause<T>;
        $orderBy: ObjectSetOrderBy<T>;
        $pageSize?: number;
    }
): UseObjects<T> {
    const { store } = useOsdkContext();
    const { $where, $orderBy, $pageSize } = opts;

    const observer = store.objectList({ type, where: $where, orderBy: $orderBy });
    let snapshot = React.useSyncExternalStore(observer.subscribe, observer.getSnapshot);

    if (!snapshot) {
        observer.refresh($pageSize);
        snapshot = observer.getSnapshot()!;
    }

    if (snapshot.type === "loading") {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw snapshot.promise;
    } else if (snapshot.type === "error") {
        throw snapshot.error;
    }

    const { hasMore, objects } = snapshot.value;
    return {
        hasMore,
        objects,
        isLoadingMore: snapshot.type === "reloading",
        loadMore: (pageSize) => observer.loadMore(pageSize ?? $pageSize),
        refresh: observer.refresh,
    };
}
