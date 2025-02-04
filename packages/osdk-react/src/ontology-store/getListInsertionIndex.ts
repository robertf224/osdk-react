import { ObjectOrInterfaceDefinition, Osdk } from "@osdk/api";
import { ObjectSetOrderBy } from "./types";

export function getListInsertionIndex<T extends ObjectOrInterfaceDefinition>(opts: {
    orderBy: ObjectSetOrderBy<T>;
    data: Osdk<T>[];
    hasMore: boolean;
    object: Osdk<T>;
}): number | undefined {
    const { orderBy, data, hasMore, object } = opts;

    const comparator = (a: Osdk<T>, b: Osdk<T>): number => {
        for (const [key, direction] of Object.entries(orderBy)) {
            const aValue = a[key];
            const bValue = b[key];

            if (aValue === bValue) continue;
            if (aValue == null) return direction === "asc" ? -1 : 1;
            if (bValue == null) return direction === "asc" ? 1 : -1;
            return direction === "asc" ? (aValue < bValue ? -1 : 1) : aValue < bValue ? 1 : -1;
        }
        return 0;
    };

    for (let index = 0; index < data.length; index++) {
        if (comparator(object, data[index]) < 0) {
            return index;
        }
    }

    // If we have more data to load and the object would go after all current items,
    // we can't determine the correct position yet.
    if (hasMore) {
        return undefined;
    }

    // Object belongs at the end.
    return data.length;
}
