export class DeepMap<K, V> implements Map<K, V> {
    #map: Map<string, V>;

    constructor() {
        this.#map = new Map();
    }

    clear = () => {
        this.#map.clear();
    };

    delete = (key: K) => {
        return this.#map.delete(JSON.stringify(key));
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    forEach = (callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any) => {
        const wrappedCallback = (value: V, key: string) => callbackfn(value, JSON.parse(key) as K, this);
        return this.#map.forEach(wrappedCallback, thisArg);
    };

    get(key: K): V | undefined {
        return this.#map.get(JSON.stringify(key));
    }

    has(key: K): boolean {
        return this.#map.has(JSON.stringify(key));
    }

    set(key: K, value: V): this {
        this.#map.set(JSON.stringify(key), value);
        return this;
    }

    *entries(): MapIterator<[K, V]> {
        for (const [key, value] of this.#map.entries()) {
            yield [JSON.parse(key), value];
        }
    }

    *keys(): MapIterator<K> {
        for (const [key] of this.entries()) {
            yield key;
        }
    }

    *values(): MapIterator<V> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [_key, value] of this.entries()) {
            yield value;
        }
    }

    get size() {
        return this.#map.size;
    }

    [Symbol.iterator](): MapIterator<[K, V]> {
        return this.entries();
    }

    [Symbol.toStringTag] = "DeepMap";
}
