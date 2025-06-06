import invariant from "tiny-invariant";

interface LruMapEntry<K, V> {
    key: K;
    value: V;
    prev: LruMapEntry<K, V> | undefined;
    next: LruMapEntry<K, V> | undefined;
}

export class LruMap<K, V> {
    #capacity: number;
    #index: Map<K, LruMapEntry<K, V>>;
    #head: LruMapEntry<K, V> | undefined;
    #tail: LruMapEntry<K, V> | undefined;

    constructor(capacity: number) {
        invariant(capacity > 0, "Capacity must be greater than 0.");
        this.#capacity = capacity;
        this.#index = new Map();
        this.#head = undefined;
        this.#tail = undefined;
    }

    get(key: K): V | undefined {
        const entry = this.#index.get(key);
        if (!entry) return undefined;

        this.#moveToFront(entry);
        return entry.value;
    }

    set(key: K, value: V): void {
        const existingEntry = this.#index.get(key);

        if (existingEntry) {
            existingEntry.value = value;
            this.#moveToFront(existingEntry);
            return;
        }

        const newEntry: LruMapEntry<K, V> = {
            key,
            value,
            prev: undefined,
            next: undefined,
        };

        if (this.#index.size >= this.#capacity) {
            if (this.#tail) {
                this.#index.delete(this.#tail.key);
                this.#removeEntry(this.#tail);
            }
        }

        this.#index.set(key, newEntry);
        this.#addToFront(newEntry);
    }

    delete(key: K): boolean {
        const entry = this.#index.get(key);
        if (!entry) return false;

        this.#index.delete(key);
        this.#removeEntry(entry);
        return true;
    }

    clear(): void {
        this.#index.clear();
        this.#head = undefined;
        this.#tail = undefined;
    }

    get size(): number {
        return this.#index.size;
    }

    *values(): IterableIterator<V> {
        let current = this.#head;
        while (current) {
            yield current.value;
            current = current.next;
        }
    }

    #removeEntry(entry: LruMapEntry<K, V>): void {
        if (entry.prev) {
            entry.prev.next = entry.next;
        } else {
            this.#head = entry.next;
        }

        if (entry.next) {
            entry.next.prev = entry.prev;
        } else {
            this.#tail = entry.prev;
        }
    }

    #addToFront(entry: LruMapEntry<K, V>): void {
        entry.next = this.#head;
        entry.prev = undefined;

        if (this.#head) {
            this.#head.prev = entry;
        }
        this.#head = entry;

        if (!this.#tail) {
            this.#tail = entry;
        }
    }

    #moveToFront(entry: LruMapEntry<K, V>): void {
        if (entry === this.#head) return;
        this.#removeEntry(entry);
        this.#addToFront(entry);
    }
}
