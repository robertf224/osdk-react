"use client";

import type { Osdk, PrimaryKeyType, ObjectTypeDefinition, WhereClause, ObjectSet } from "@osdk/api";
import { useOsdkContext } from "./OsdkContext";
import {
    QueryClient,
    UseSuspenseQueryOptions,
    UseSuspenseQueryResult,
    useSuspenseQuery,
} from "@tanstack/react-query";
import { OntologyObservation } from "./ontology";

const QUERY_KEY_PREFIX = ["osdk", "object"];

export function useObject<T extends ObjectTypeDefinition, R = Osdk<T> | null>(
    type: T,
    primaryKey: PrimaryKeyType<T>,
    queryOpts?: Omit<
        UseSuspenseQueryOptions<Osdk<T> | null, Error, R>,
        "queryKey" | "queryFn" | "initialData" | "initialDataUpdatedAt"
    >
): [R, Omit<UseSuspenseQueryResult<R>, "data">] {
    const { client } = useOsdkContext();
    const { data, ...rest } = useSuspenseQuery({
        ...queryOpts,
        queryFn: async () => {
            const objectType = await client.fetchMetadata(type);
            const result = await (client(type) as ObjectSet<T>)
                .where({
                    [objectType.primaryKeyApiName]: primaryKey,
                } as WhereClause<T>)
                .fetchPage({ $pageSize: 1 });
            return result.data[0] ?? null;
        },
        queryKey: [...QUERY_KEY_PREFIX, type.apiName, primaryKey],
    });
    return [data, rest];
}

export function updateObjectQueries(queryClient: QueryClient, observation: OntologyObservation) {
    observation.knownObjects.forEach((object) => {
        queryClient.setQueryData([...QUERY_KEY_PREFIX, object.objectType, object.primaryKey], object);
    });
    observation.deletedObjects.forEach((object) => {
        queryClient.setQueryData([...QUERY_KEY_PREFIX, object.objectType, object.primaryKey], null);
    });
}
