import type { ObjectOrInterfaceDefinition, Osdk, WhereClause, ObjectSet as ObjectSetClient } from "@osdk/api";
import type { Client } from "@osdk/client";
import memoize from "memoize-one";
import { modernToLegacyWhereClause } from "./modernToLegacyWhereClause";
import { objectMatchesFilter } from "./objectMatchesFilter";

export class ObjectSet<T extends ObjectOrInterfaceDefinition> {
    #client: Client;
    // Real Object Sets can obviously be more complex than this, but this is all we allow for now partly
    // because it's what OSDK actually lets us get, partly because it will keep the implementation scoped down.
    #type: T;
    #where?: WhereClause<T>;

    constructor(client: Client, type: T, where?: WhereClause<T>) {
        this.#client = client;
        this.#type = type;
        this.#where = where;
    }

    #getFilter = memoize(() =>
        this.#where ? modernToLegacyWhereClause(this.#where, this.#type) : undefined
    );
    get #filter() {
        return this.#getFilter();
    }

    get hasFilter() {
        return this.#where !== undefined;
    }

    get type() {
        return this.#type;
    }

    contains = (object: Osdk<ObjectOrInterfaceDefinition>) => {
        try {
            // We're relying on $as throwing errors here which is janky
            // https://github.com/palantir/osdk-ts/blob/c70821e7f5c13826a5e3f2b86b6bacf0bb3f909e/packages/client/src/object/convertWireToOsdkObjects/getDollarAs.ts#L60
            const normalizedObject = object.$as(this.#type.apiName);
            return this.#filter ? objectMatchesFilter(normalizedObject, this.#filter) : true;
        } catch {
            return false;
        }
    };

    toOSDK = memoize((): ObjectSetClient<T> => {
        const objectSetClient = this.#client(this.#type);
        return this.#where ? objectSetClient.where(this.#where) : objectSetClient;
    });

    toJSON = () => {
        return { type: this.#type.apiName, filter: this.#filter };
    };
}
