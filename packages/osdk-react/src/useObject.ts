"use client";

import type { Osdk, PrimaryKeyType, CompileTimeMetadata, ObjectTypeDefinition, WhereClause } from "@osdk/api";
import { useOsdkContext } from "./OsdkContext";
import React from "react";

export type UseObject<T extends ObjectTypeDefinition> = [object: Osdk<T> | undefined, refresh: () => void];

export function useObject<T extends ObjectTypeDefinition>(
    type: T,
    $where?: {
        [primaryKey in CompileTimeMetadata<T>["primaryKeyApiName"]]: PrimaryKeyType<T>;
    }
): UseObject<T> {
    const { store } = useOsdkContext();

    const observer = store.objectList({ type, where: $where as WhereClause<T>, orderBy: {} });
    let snapshot = React.useSyncExternalStore(observer.subscribe, observer.getSnapshot);

    if (!snapshot) {
        observer.refresh(1);
        snapshot = observer.getSnapshot()!;
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
