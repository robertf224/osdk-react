export type Comparator<V> = (a: V, b: V) => number;

export interface OrderedMap<K, V> {
    set: (key: K, value: V) => this;
    delete: (key: K) => boolean;
    values: () => IterableIterator<V>;
    size: number;
    findInsertionIndex(key: K, value: V): number;
}
