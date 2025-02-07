import type { FetchPageArgs, ObjectOrInterfaceDefinition, Osdk } from "@osdk/api";
import { ObjectSet } from "./object-set";
import { Comparator } from "./utils";
import memoize from "memoize-one";

export type ObjectSetOrderBy<T extends ObjectOrInterfaceDefinition> = NonNullable<
    FetchPageArgs<T>["$orderBy"]
>;

export class ObjectList<T extends ObjectOrInterfaceDefinition> {
    #objectSet: ObjectSet<T>;
    #orderBy: ObjectSetOrderBy<T>;

    constructor(objectSet: ObjectSet<T>, orderBy: ObjectSetOrderBy<T>) {
        this.#objectSet = objectSet;
        this.#orderBy = orderBy;
    }

    get objectSet() {
        return this.#objectSet;
    }

    get orderBy() {
        return this.#orderBy;
    }

    getComparator = memoize((): Comparator<Osdk<T>> => {
        return (a, b) => {
            for (const [key, direction] of Object.entries(this.#orderBy) as [
                keyof Osdk<T>,
                "asc" | "desc",
            ][]) {
                const aValue = a[key];
                const bValue = b[key];

                if (aValue === bValue) continue;
                if (aValue == null) return direction === "asc" ? -1 : 1;
                if (bValue == null) return direction === "asc" ? 1 : -1;
                return direction === "asc" ? (aValue < bValue ? -1 : 1) : aValue < bValue ? 1 : -1;
            }
            return 0;
        };
    });

    toJSON = () => {
        return {
            objectSet: this.#objectSet,
            orderBy: this.#orderBy,
        };
    };
}
