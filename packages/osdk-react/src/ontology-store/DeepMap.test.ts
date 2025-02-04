import { describe, it, expect } from "vitest";
import { DeepMap } from "./DeepMap";

describe("DeepMap", () => {
    it("should work with different object references that are deeply equal", () => {
        const map = new DeepMap<{ id: string; nested?: { value: number } }, string>();

        const originalKey = { id: "test", nested: { value: 123 } };
        map.set(originalKey, "value");

        const differentKey = { id: "test", nested: { value: 123 } };
        expect(map.get(differentKey)).toBe("value");
        expect(originalKey).not.toBe(differentKey); // Different references
        expect(map.has(differentKey)).toBe(true);
    });

    it("should handle multiple entries with complex object keys", () => {
        const map = new DeepMap<{ user: { id: string; role: string } }, number>();

        const key1 = { user: { id: "a", role: "admin" } };
        const key2 = { user: { id: "b", role: "user" } };
        map.set(key1, 1);
        map.set(key2, 2);

        const lookupKey1 = { user: { id: "a", role: "admin" } };
        const lookupKey2 = { user: { id: "b", role: "user" } };

        expect(map.size).toBe(2);
        expect(map.get(lookupKey1)).toBe(1);
        expect(map.get(lookupKey2)).toBe(2);
    });

    it("should support deletion with structurally equal keys", () => {
        const map = new DeepMap<{ config: { id: string; flags: string[] } }, string>();

        const originalKey = { config: { id: "test", flags: ["flag1", "flag2"] } };
        map.set(originalKey, "value");

        const deleteKey = { config: { id: "test", flags: ["flag1", "flag2"] } };
        expect(map.has(deleteKey)).toBe(true);

        map.delete(deleteKey);
        expect(map.has(originalKey)).toBe(false);
        expect(map.get(originalKey)).toBeUndefined();
    });

    it("should support iteration methods with complex objects", () => {
        const map = new DeepMap<{ meta: { id: string; tags: string[] } }, number>();
        const entries = [
            [{ meta: { id: "a", tags: ["tag1"] as string[] } }, 1],
            [{ meta: { id: "b", tags: ["tag2", "tag3"] as string[] } }, 2],
        ] as const;

        entries.forEach(([k, v]) => map.set(k, v));

        // Test entries() with different object references
        const lookupEntries = [
            [{ meta: { id: "a", tags: ["tag1"] } }, 1],
            [{ meta: { id: "b", tags: ["tag2", "tag3"] } }, 2],
        ] as const;
        const iteratedEntries = Array.from(map.entries());
        expect(iteratedEntries).toEqual(lookupEntries);

        // Test keys() with different object references
        const keys = Array.from(map.keys());
        expect(keys).toEqual(lookupEntries.map(([k]) => k));

        // Test values()
        const values = Array.from(map.values());
        expect(values).toEqual(lookupEntries.map(([, v]) => v));
    });

    it("should support forEach with structurally equal objects", () => {
        const map = new DeepMap<{ data: { id: string; items: number[] } }, number>();
        const entries = [
            [{ data: { id: "a", items: [1, 2] as number[] } }, 10],
            [{ data: { id: "b", items: [3, 4] as number[] } }, 20],
        ] as const;

        entries.forEach(([k, v]) => map.set(k, v));

        const result: Array<[{ data: { id: string; items: number[] } }, number]> = [];
        map.forEach((value, key) => {
            result.push([key, value]);
        });

        const expectedEntries = [
            [{ data: { id: "a", items: [1, 2] } }, 10],
            [{ data: { id: "b", items: [3, 4] } }, 20],
        ];
        expect(result).toEqual(expectedEntries);
    });

    it("should clear all entries regardless of key complexity", () => {
        const map = new DeepMap<{ settings: { id: string; options: Record<string, boolean> } }, number>();

        const key1 = { settings: { id: "a", options: { enabled: true } } };
        const key2 = { settings: { id: "b", options: { enabled: false } } };
        map.set(key1, 1);
        map.set(key2, 2);

        expect(map.size).toBe(2);

        map.clear();
        expect(map.size).toBe(0);

        const lookupKey1 = { settings: { id: "a", options: { enabled: true } } };
        const lookupKey2 = { settings: { id: "b", options: { enabled: false } } };
        expect(map.get(lookupKey1)).toBeUndefined();
        expect(map.get(lookupKey2)).toBeUndefined();
    });
});
