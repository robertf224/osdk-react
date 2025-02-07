import type { ObjectOrInterfaceDefinition, Osdk } from "@osdk/api";
import type { SearchJsonQueryV2, PropertyIdentifier } from "@osdk/internal.foundry.core";

export function objectMatchesFilter(
    object: Osdk<ObjectOrInterfaceDefinition>,
    filter: SearchJsonQueryV2
): boolean {
    if (filter.type === "and") {
        return filter.value.every((f) => objectMatchesFilter(object, f));
    } else if (filter.type === "or") {
        return filter.value.some((f) => objectMatchesFilter(object, f));
    } else if (filter.type === "not") {
        return !objectMatchesFilter(object, filter.value);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    const value = getPropertyValue(object, filter.propertyIdentifier!) as any;
    if (filter.type === "eq") {
        return value === filter.value;
    } else if (filter.type === "gt") {
        return value > filter.value;
    } else if (filter.type === "gte") {
        return value >= filter.value;
    } else if (filter.type === "lt") {
        return value < filter.value;
    } else if (filter.type === "lte") {
        return value <= filter.value;
    }
    // TODO: implement the rest of the filters
    return false;
}

// TODO: figure out how this works with array properties
function getPropertyValue(
    object: Osdk<ObjectOrInterfaceDefinition>,
    propertyIdentifier: PropertyIdentifier
): unknown {
    if (propertyIdentifier.type === "property") {
        return object[propertyIdentifier.apiName];
    } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        return object[propertyIdentifier.propertyApiName][propertyIdentifier.structFieldApiName];
    }
}
