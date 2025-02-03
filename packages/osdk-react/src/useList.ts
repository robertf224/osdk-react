"use client";

import type { ObjectOrInterfaceDefinition, Osdk, WhereClause } from "@osdk/api";
import { ObjectSetOrderBy } from "./ontology-store";
import { useOsdkContext } from "./OsdkContext";
import React from "react";
import { ListSubscriptionResponse } from "./ontology-store/types";

export interface UseList<T extends ObjectOrInterfaceDefinition> {
    objects: Osdk<T>[];
    hasMore: boolean;
    isLoadingMore: boolean;
    loadMore: (pageSize?: number) => void;
    refresh: () => void;
}

export function useList<T extends ObjectOrInterfaceDefinition>(
    type: ObjectOrInterfaceDefinition,
    where: WhereClause<T>,
    args: {
        $where?: WhereClause<T>;
        $orderBy: ObjectSetOrderBy<T>;
        $pageSize?: number;
    }
): UseList<T> {
    const { store } = useOsdkContext();

    const subscription = React.useRef<ListSubscriptionResponse | null>(null);

    const subscribe = React.useCallback(
        (callback: () => void) => {
            subscription.current = store.requestListSubscription({
                type,
                $where: where,
                ...args,
                callback,
            });

            return () => {
                subscription.current?.dispose();
                subscription.current = null;
            };
        },
        [store, type, where, args]
    );

    const getSnapshot = React.useCallback(() => {
        return (
            subscription.current?.getSnapshot() ?? {
                type: "loading",
                promise: Promise.resolve(),
            }
        );
    }, []);

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
