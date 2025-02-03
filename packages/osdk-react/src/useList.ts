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
    where: WhereClause<T>,
    args: {
        $where?: WhereClause<T>;
        $orderBy: ObjectSetOrderBy<T>;
        $pageSize?: number;
    }
): UseList<T> {
    const { store } = useOsdkContext();
    const r = React.useSyncExternalStore<string>(
        // should
        () => {}
    );
}
