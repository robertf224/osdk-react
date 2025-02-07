export type AsyncValue<T> =
    | { type: "loading"; promise: Promise<unknown> }
    | { type: "loaded"; value: T }
    | { type: "reloading"; value: T; promise: Promise<unknown> }
    | { type: "error"; error: Error };

function mapValue<T, U>(asyncValue: AsyncValue<T>, map: (value: T) => U): AsyncValue<U> {
    if (asyncValue.type === "loaded") {
        return { type: asyncValue.type, value: map(asyncValue.value) };
    } else if (asyncValue.type === "reloading") {
        return { ...asyncValue, type: "reloading", value: map(asyncValue.value) };
    } else {
        return asyncValue;
    }
}

export const AsyncValue = {
    mapValue,
};
