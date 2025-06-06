import { describe, it, expect } from "vitest";
import { LruMap } from "./LruMap";

describe("LruMap", () => {
    it("should throw error when capacity is 0 or negative", () => {
        expect(() => new LruMap(0)).toThrow("Capacity must be greater than 0");
        expect(() => new LruMap(-1)).toThrow("Capacity must be greater than 0");
    });

    it("should maintain size within capacity", () => {
        const lru = new LruMap<string, number>(2);
        expect(lru.size).toBe(0);

        lru.set("a", 1);
        expect(lru.size).toBe(1);

        lru.set("b", 2);
        expect(lru.size).toBe(2);

        lru.set("c", 3);
        expect(lru.size).toBe(2);
    });

    it("should evict least recently used entry when at capacity", () => {
        const lru = new LruMap<string, number>(2);

        lru.set("a", 1);
        lru.set("b", 2);
        lru.set("c", 3);

        expect(lru.get("a")).toBeUndefined();
        expect(lru.get("b")).toBe(2);
        expect(lru.get("c")).toBe(3);
    });

    it("should update existing entry and move it to front", () => {
        const lru = new LruMap<string, number>(2);

        lru.set("a", 1);
        lru.set("b", 2);
        lru.set("a", 3);

        expect(lru.get("a")).toBe(3);
        expect(lru.get("b")).toBe(2);
    });

    it("should move accessed entry to front", () => {
        const lru = new LruMap<string, number>(2);

        lru.set("a", 1);
        lru.set("b", 2);
        lru.get("a");
        lru.set("c", 3);

        expect(lru.get("a")).toBe(1);
        expect(lru.get("b")).toBeUndefined();
        expect(lru.get("c")).toBe(3);
    });

    it("should clear all entries", () => {
        const lru = new LruMap<string, number>(2);

        lru.set("a", 1);
        lru.set("b", 2);
        expect(lru.size).toBe(2);

        lru.clear();
        expect(lru.size).toBe(0);
        expect(lru.get("a")).toBeUndefined();
        expect(lru.get("b")).toBeUndefined();
    });

    it("should work with different types", () => {
        const lru = new LruMap<number, string>(2);

        lru.set(1, "a");
        lru.set(2, "b");
        lru.set(3, "c");

        expect(lru.get(1)).toBeUndefined();
        expect(lru.get(2)).toBe("b");
        expect(lru.get(3)).toBe("c");
    });

    it("should handle undefined values", () => {
        const lru = new LruMap<string, number | undefined>(2);

        lru.set("a", undefined);
        lru.set("b", 2);

        expect(lru.get("a")).toBeUndefined();
        expect(lru.get("b")).toBe(2);
    });
});
