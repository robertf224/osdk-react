import { Comparator, OrderedMap } from "./OrderedMap";

export class ArrayOrderedMap<K, V> implements OrderedMap<K, V> {
    #comparator: Comparator<V>;
    #data: { key: K; value: V }[] = [];

    constructor(comparator: Comparator<V>, data?: { key: K; value: V }[]) {
        this.#comparator = comparator;
        if (data) {
            this.#data = data;
        }
    }

    set = (key: K, value: V): this => {
        this.delete(key);
        const insertionIndex = this.findInsertionIndex(key, value);
        this.#data.splice(insertionIndex, 0, { key, value });
        return this;
    };

    delete = (key: K): boolean => {
        const index = this.#data.findIndex((e) => e.key === key);
        if (index !== -1) {
            this.#data.splice(index, 1);
            return true;
        } else {
            return false;
        }
    };

    values = (): IterableIterator<V> => this.#data.map((e) => e.value).values();

    get size(): number {
        return this.#data.length;
    }

    findInsertionIndex = (key: K, value: V): number => {
        if (this.#data.length === 0 || this.#comparator(value, this.#data[0]!.value) < 0) {
            return 0;
        }

        // TODO: optimization for checking the end first

        for (let index = 0; index < this.#data.length - 1; index++) {
            if (
                this.#comparator(value, this.#data[index]!.value) >= 0 &&
                this.#comparator(value, this.#data[index + 1]!.value) < 0
            ) {
                return index + 1;
            }
        }

        return this.#data.length;
    };
}
