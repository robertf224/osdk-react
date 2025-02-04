import type {
    FetchPageArgs,
    ObjectOrInterfaceDefinition,
    Osdk,
    PrimaryKeyType,
    WhereClause,
} from "@osdk/api";
import { SearchJsonQueryV2 } from "@osdk/internal.foundry.core";
import { AsyncValue } from "./AsyncValue";

// Real Object Sets can obviously be more complex than this, but this is all we allow for now partly
// because it's what OSDK actually lets us get, partly because it will keep the implementation scoped down.
export type ObjectSet<T extends ObjectOrInterfaceDefinition> = {
    type: T;
    filter?: SearchJsonQueryV2;
};

export interface ObjectSetReference {
    type: string;
    filter?: SearchJsonQueryV2;
}

export interface ObjectReference {
    objectType: string;
    primaryKey: string | number;
}

export type ObjectSetOrderBy<T extends ObjectOrInterfaceDefinition> = FetchPageArgs<T>["$orderBy"];

export type ListObserverSnapshot<T extends ObjectOrInterfaceDefinition> = AsyncValue<{
    objects: Osdk<T>[];
    hasMore: boolean;
}>;

// TODO: support property selection
export interface ListObserverRequest<T extends ObjectOrInterfaceDefinition> {
    type: T;
    where?: WhereClause<T>;
    orderBy: ObjectSetOrderBy<T>;
}

export interface ListObserverResponse<T extends ObjectOrInterfaceDefinition> {
    subscribe: (callback: () => void) => () => void;
    getSnapshot: () => ListObserverSnapshot<T> | undefined;
    loadMore: (pageSize?: number) => void;
    refresh: (pageSize?: number) => void;
}

// TODO: live object sets
// TODO: aggregations, queries

// TODO: maybe advertise that we’ve learned an object set is completely known to possibly complete some other ones
export type OntologyObservation<T extends ObjectOrInterfaceDefinition> =
    | {
          type: "loaded-objects";
          objectSet: ObjectSet<T>;
          objects: Osdk<T>[];
          orderBy: ObjectSetOrderBy<T>;
          afterPrimaryKey?: PrimaryKeyType<T>;
      }
    | {
          type: "object-set-changes";
          objectSet: ObjectSet<T>;
          change: "added-or-updated" | "removed";
          object: Osdk<T>;
      }; // TODO: Action updates
