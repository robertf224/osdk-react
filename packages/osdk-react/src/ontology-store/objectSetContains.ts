import { ObjectOrInterfaceDefinition, Osdk } from "@osdk/api";
import { ObjectSet } from "./types";
import { SearchJsonQueryV2, PropertyIdentifier } from "@osdk/internal.foundry.core";

export function objectSetContains(
    objectSet: ObjectSet<ObjectOrInterfaceDefinition>,
    object: Osdk<ObjectOrInterfaceDefinition>
): boolean {
    try {
        // We're relying on $as throwing errors here which is janky
        // https://github.com/palantir/osdk-ts/blob/c70821e7f5c13826a5e3f2b86b6bacf0bb3f909e/packages/client/src/object/convertWireToOsdkObjects/getDollarAs.ts#L60
        const normalizedObject = object.$as(objectSet.type);
        if (!objectSet.filter) {
            return true;
        }
        return objectMatchesFilter(normalizedObject, objectSet.filter);
    } catch {
        return false;
    }
}

// TODO: figure out if we need to do any deep equals in here
function objectMatchesFilter(object: Osdk<ObjectOrInterfaceDefinition>, filter: SearchJsonQueryV2): boolean {
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
