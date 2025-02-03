"use client";

import type { ObjectOrInterfaceDefinition, Osdk, WhereClause } from "@osdk/api";
import { ObjectSetOrderBy } from "./ontology-store";
import { useOsdkContext } from "./OsdkContext";
import React from "react";

export interface UseList<T extends ObjectOrInterfaceDefinition> {
    objects: Osdk<T>[];
    hasMore: boolean;
    isLoadingMore: boolean;
    loadMore: (pageSize?: number) => void;
    refresh: () => void;
}

export function useList<T extends ObjectOrInterfaceDefinition>(
    type: ObjectOrInterfaceDefinition,
    {
        $where,
        $orderBy,
        $pageSize,
    }: {
        $where?: WhereClause<T>;
        $orderBy: ObjectSetOrderBy<T>;
        $pageSize?: number;
    }
): UseList<T> {
    const { store } = useOsdkContext();

    // TODO: handle changing props
    const [observer] = React.useState(() => store.list({ type, $where, $orderBy, $pageSize }));
    React.useEffect(() => {
        return observer.dispose;
    }, []);
    let snapshot = React.useSyncExternalStore(observer.subscribe, observer.getSnapshot);

    if (!snapshot) {
        observer.refresh();
        snapshot = observer.getSnapshot()!;
    }

    if (snapshot.type === "loading") {
        // Suspense!
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
        loadMore: observer.loadMore,
        refresh: observer.refresh,
    };
}
