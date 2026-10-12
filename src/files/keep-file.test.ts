import { describe, expect, it } from "vitest";
import type { FileRule } from "./file-check";
import { CSV } from "./file-kinds";
import { keepFile } from "./keep-file";
import { memoryStore, unreachableStore } from "./memory-store";

const RULE: FileRule = { kinds: [CSV], maxBytes: 100 };
const CONTENT = new TextEncoder().encode("nim,nama\n1,Uji\n");

describe("keepFile", () => {
  it("keeps a checked file under a new key in the folder, and it comes back unchanged", async () => {
    const store = memoryStore();

    const kept = await keepFile(
      store,
      "uji",
      { name: "daftar.csv", bytes: CONTENT },
      RULE,
    );

    if (!kept.ok) throw new Error("The file was not kept.");
    expect(kept.key).toMatch(/^uji\/[0-9a-f-]{36}$/);
    expect(kept.contentType).toBe("text/csv; charset=utf-8");
    expect(await store.get(kept.key)).toEqual(CONTENT);
  });

  it("gives each file its own key, so one never replaces another", async () => {
    const store = memoryStore();
    const file = { name: "daftar.csv", bytes: CONTENT };

    await keepFile(store, "uji", file, RULE);
    await keepFile(store, "uji", file, RULE);

    expect(store.files.size).toBe(2);
  });

  it.each([
    ["a kind that is not allowed", "foto.png", CONTENT, "wrong-kind"],
    ["an empty file", "daftar.csv", new Uint8Array(), "empty"],
    [
      "a file that is too large",
      "daftar.csv",
      new Uint8Array(101),
      "too-large",
    ],
    [
      "a picture renamed to .csv",
      "foto.csv",
      new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      "wrong-content",
    ],
  ])("refuses %s and keeps nothing", async (_what, name, bytes, fault) => {
    const store = memoryStore();

    const kept = await keepFile(store, "uji", { name, bytes }, RULE);

    expect(kept).toEqual({ ok: false, fault });
    expect(store.files.size).toBe(0);
  });

  it("fails loudly when the file storage cannot be reached", async () => {
    const file = { name: "daftar.csv", bytes: CONTENT };

    await expect(
      keepFile(unreachableStore(), "uji", file, RULE),
    ).rejects.toThrow("The file storage cannot be reached.");
  });
});
