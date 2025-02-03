"use client";

import type { ObjectOrInterfaceDefinition, Osdk, WhereClause } from "@osdk/api";
import { ObjectSetOrderBy } from "./ontology-store";
import { useOsdkContext } from "./OsdkContext";
import React from "react";
import { ListSubscriptionResponse } from "./ontology-store/types";

const defaultSnapshot = {
    type: "loading",
    promise: Promise.resolve(),
} as const;

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

    const subscription = React.useRef<ListSubscriptionResponse | null>(null);

    const subscribe = React.useCallback(
        (callback: () => void) => {
            console.log("SUBSCRIBE");
            subscription.current = store.requestListSubscription({
                type,
                $where,
                $orderBy,
                $pageSize,
                callback,
            });

            return () => {
                subscription.current?.dispose();
                subscription.current = null;
            };
        },
        [store, type, $where, $orderBy, $pageSize]
    );

    const getSnapshot = React.useCallback(() => {
        return subscription.current?.getSnapshot() ?? defaultSnapshot;
    }, [subscription]);

    const snapshot = React.useSyncExternalStore(subscribe, getSnapshot);

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
        loadMore: (pageSize?: number) => subscription.current?.loadMore(pageSize),
        refresh: () => subscription.current?.refresh(),
    };
}
