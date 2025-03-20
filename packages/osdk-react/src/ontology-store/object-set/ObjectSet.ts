import type { ObjectOrInterfaceDefinition, Osdk, WhereClause, ObjectSet as ObjectSetClient } from "@osdk/api";
import type { Client } from "@osdk/client";
import memoize from "memoize-one";
import { objectMatchesFilter } from "./objectMatchesFilter";

export class ObjectSet<T extends ObjectOrInterfaceDefinition> {
    #client: Client;
    // Real Object Sets can obviously be more complex than this, but this is all we allow for now partly
    // because it's what OSDK actually lets us get, partly because it will keep the implementation scoped down.
    #type: T;
    #filter?: WhereClause<T>;

    constructor(client: Client, type: T, filter?: WhereClause<T>) {
        this.#client = client;
        this.#type = type;
        this.#filter = filter;
    }

    get hasFilter() {
        return this.#filter !== undefined;
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
        // Getting a type error like `Type 'ObjectTypeDefinition' is not assignable to type 'Experiment<"2.0.8"> | Experiment<"2.1.0">'.`
        // think something needs to get fixed upstream.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const objectSetClient = this.#client(this.#type as any) as ObjectSetClient<T>;
        return this.#filter ? objectSetClient.where(this.#filter) : objectSetClient;
    });

    toJSON = () => {
        return { type: this.#type.apiName, filter: this.#filter };
    };
}
