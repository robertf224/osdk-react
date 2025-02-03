import type { FetchPageArgs, ObjectOrInterfaceDefinition, Osdk, WhereClause } from "@osdk/api";
import { SearchJsonQueryV2 } from "@osdk/internal.foundry.core";

export type AsyncValue<T> = { type: "loading"; value: Promise<T> };

// Real Object Sets can obviously be more complex than this, but this is all we allow for now partly
// because it's what OSDK actually lets us get, partly because it will keep the implementation scoped down.
export type ObjectSet<T extends ObjectOrInterfaceDefinition> = {
    type: T;
    filter?: SearchJsonQueryV2;
};

export interface ObjectReference {
    objectType: string;
    primaryKey: string | number;
}

export type ObjectSetOrderBy<T extends ObjectOrInterfaceDefinition> = FetchPageArgs<T>["$orderBy"];

export interface ListSubscriptionSnapshot<T extends ObjectOrInterfaceDefinition> {
    data: Promise<{ objects: Osdk<T>[]; hasMore: boolean }>;
    isLoadingMore: boolean;
}

// TODO: support property selection
export interface ListSubscriptionRequest<T extends ObjectOrInterfaceDefinition> {
    type: T;
    $where?: WhereClause<T>;
    $orderBy: ObjectSetOrderBy<T>;
    $pageSize?: number;
    callback: (snapshot: ListSubscriptionSnapshot<T>) => void;
}

export interface ListSubscriptionResponse {
    loadMore: (pageSize: number) => void;
    refresh: () => void;
    dispose: () => void;
}

// TODO: live object sets
// TODO: aggregations, queries

// TODO: maybe advertise that we’ve learned an object set is completely known to possibly complete some other ones
export interface ObjectSetChange<T extends ObjectOrInterfaceDefinition> {
    objectSet: ObjectSet<T>;
    updated: {
        // TODO: possibly include whether we know an object to have been created
        objects: Osdk<T>[];
        listMetadata: {
            orderBy: ObjectSetOrderBy<T>;
            afterPrimaryKey?: string | number | boolean;
        };
    };
    // TODO: possibly include whether we know an object to have been deleted
    removedObjectIds: ObjectReference[];
}
