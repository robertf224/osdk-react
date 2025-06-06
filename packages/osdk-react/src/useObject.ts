"use client";

import type { Osdk, PrimaryKeyType, CompileTimeMetadata, ObjectTypeDefinition, WhereClause } from "@osdk/api";
import { useOsdkContext } from "./OsdkContext";
import React from "react";
import { ObjectSetOrderBy } from "./ontology-store/ObjectList";

export type UseObject<T extends ObjectTypeDefinition> = [object: Osdk<T> | undefined, refresh: () => void];

export function useObject<T extends ObjectTypeDefinition>(
    type: T,
    $where: {
        [primaryKey in CompileTimeMetadata<T>["primaryKeyApiName"]]: PrimaryKeyType<T>;
    }
): UseObject<T> {
    const { store } = useOsdkContext();

    const primaryKeyProperty = Object.keys($where)[0]!;
    const primaryKey = $where[primaryKeyProperty as CompileTimeMetadata<T>["primaryKeyApiName"]];

    const observer = store.objectList({
        type,
        where: $where as WhereClause<T>,
        orderBy: {
            [primaryKeyProperty]: "asc",
        } as ObjectSetOrderBy<T>,
    });
    let snapshot = React.useSyncExternalStore(observer.subscribe, observer.getSnapshot);

    if (!snapshot) {
        observer.refresh(1);
        snapshot = observer.getSnapshot()!;
    }

    const initialValue = store.lookup(type, primaryKey);
    if (initialValue) {
        return [initialValue, observer.refresh];
    }

    if (snapshot.type === "loading") {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw snapshot.promise;
    } else if (snapshot.type === "error") {
        throw snapshot.error;
    }

    const { objects } = snapshot.value;
    return [objects[0], observer.refresh];
}
