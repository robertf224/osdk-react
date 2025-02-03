export type AsyncValue<T> =
    | { type: "loading"; promise: Promise<T> }
    | { type: "loaded"; value: T }
    | { type: "reloading"; value: T; promise: Promise<T> }
    | { type: "error"; error: Error };

function mapValue<T, U>(asyncValue: AsyncValue<T>, map: (value: T) => U): AsyncValue<U> {
    if (asyncValue.type === "loading") {
        return { type: "loading", promise: asyncValue.promise.then(map) };
    } else if (asyncValue.type === "loaded") {
        return { type: asyncValue.type, value: map(asyncValue.value) };
    } else if (asyncValue.type === "reloading") {
        return { type: "reloading", value: map(asyncValue.value), promise: asyncValue.promise.then(map) };
    } else {
        return asyncValue;
    }
}

function getPromise<T>(asyncValue: AsyncValue<T>): Promise<T> | undefined {
    if (asyncValue.type === "loading" || asyncValue.type === "reloading") {
        return asyncValue.promise;
    }
}

export const AsyncValue = {
    mapValue,
    getPromise,
};
