import { describe, expect, it } from "vitest";
import { deployFiles, emptyPrPreviewFiles } from "./deploy-files";
import { type MemoryStore, memoryStore } from "./memory-store";

const FILE = { bytes: new Uint8Array([1]), contentType: "text/csv" };
const OTHERS = [
  "main-preview/student-files/c",
  "local/student-files/d",
  "campus/student-files/e",
  "pr-previews-old/student-files/f",
];

/** A storage that holds files of every kind of environment. */
async function sharedStore(): Promise<MemoryStore> {
  const store = memoryStore();
  const keys = [
    "pr-previews/student-files/a",
    "pr-previews/student-files/b",
    ...OTHERS,
  ];
  for (const key of keys) {
    await store.put(key, FILE);
  }
  return store;
}

describe("emptyPrPreviewFiles", () => {
  it("removes every file of the PR previews, and no other file", async () => {
    const store = await sharedStore();

    const removed = await emptyPrPreviewFiles(store, "pr-previews");

    expect(removed).toBe(2);
    expect([...store.files.keys()]).toEqual(OTHERS);
  });

  it.each(["main-preview", "local", "campus", "", "pr-previews/"])(
    "refuses to empty the place %o, and removes nothing",
    async (place) => {
      const store = await sharedStore();

      await expect(emptyPrPreviewFiles(store, place)).rejects.toThrow(
        "refused to empty them",
      );
      expect(store.files.size).toBe(OTHERS.length + 2);
    },
  );
});

describe("deployFiles", () => {
  it("empties the files of the PR previews on a PR deploy", async () => {
    const store = await sharedStore();

    const done = await deployFiles(store, "pr-preview", "feat/uji");

    expect(done).toBe("PR preview files emptied: 2 removed.");
    expect([...store.files.keys()]).toEqual(OTHERS);
  });

  it("keeps every file on a deploy of main", async () => {
    const store = await sharedStore();

    const done = await deployFiles(store, "main-preview", "main");

    expect(done).toBe("Files of main kept.");
    expect(store.files.size).toBe(OTHERS.length + 2);
  });

  it("does nothing, and says so, while the settings are empty", async () => {
    expect(await deployFiles(null, "pr-preview", "feat/uji")).toBe(
      "The file storage settings are empty; no file is kept.",
    );
    expect(await deployFiles(null, "main-preview", "main")).toBe(
      "The file storage settings are empty; no file is kept.",
    );
  });

  it("refuses a production deploy that does not come from main, as the database step does", async () => {
    const store = await sharedStore();

    await expect(
      deployFiles(store, "main-preview", "feat/uji"),
    ).rejects.toThrow("refused");
    expect(store.files.size).toBe(OTHERS.length + 2);
  });

  it.each(["local", "campus"] as const)(
    "refuses to run in %s, and removes nothing",
    async (stage) => {
      const store = await sharedStore();

      await expect(deployFiles(store, stage, undefined)).rejects.toThrow(
        "runs only in a Vercel build",
      );
      expect(store.files.size).toBe(OTHERS.length + 2);
    },
  );
});
