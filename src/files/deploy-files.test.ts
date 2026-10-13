import { describe, expect, it } from "vitest";
import {
  deployFiles,
  emptyPreviewFiles,
  type MainStarts,
} from "./deploy-files";
import {
  type MemoryStore,
  memoryStore,
  unreachableStore,
} from "./memory-store";

const FILE = { bytes: new Uint8Array([1]), contentType: "text/csv" };
const OF_PR_PREVIEWS = [
  "pr-previews/student-files/a",
  "pr-previews/student-files/b",
];
const OF_MAIN = ["main-preview/student-files/c"];
const OF_NO_PREVIEW = [
  "local/student-files/d",
  "campus/student-files/e",
  "pr-previews-old/student-files/f",
  "main-preview-old/student-files/g",
];
const ALL = [...OF_PR_PREVIEWS, ...OF_MAIN, ...OF_NO_PREVIEW];

/** A storage that holds files of every kind of environment. */
async function sharedStore(): Promise<MemoryStore> {
  const store = memoryStore();
  for (const key of ALL) {
    await store.put(key, FILE);
  }
  return store;
}

interface StandInStarts extends MainStarts {
  waiting: boolean;
}

/** Stands in for the mark of a start in the database of main. */
function startsOfMain(waiting: boolean): StandInStarts {
  const starts: StandInStarts = {
    waiting,
    waitsForFiles: async () => starts.waiting,
    async noteFilesEmptied() {
      starts.waiting = false;
    },
  };
  return starts;
}

/** A database that must not be asked: a PR deploy has no use for it. */
const NEVER_ASKED: MainStarts = {
  async waitsForFiles() {
    throw new Error("The mark of a start was read.");
  },
  async noteFilesEmptied() {
    throw new Error("The mark of a start was changed.");
  },
};

describe("emptyPreviewFiles", () => {
  it("removes every file of the PR previews, and no other file", async () => {
    const store = await sharedStore();

    const removed = await emptyPreviewFiles(store, "pr-previews");

    expect(removed).toBe(2);
    expect([...store.files.keys()]).toEqual([...OF_MAIN, ...OF_NO_PREVIEW]);
  });

  it("removes every file of the preview of main, and no other file", async () => {
    const store = await sharedStore();

    const removed = await emptyPreviewFiles(store, "main-preview");

    expect(removed).toBe(1);
    expect([...store.files.keys()]).toEqual([
      ...OF_PR_PREVIEWS,
      ...OF_NO_PREVIEW,
    ]);
  });

  it.each([
    "local",
    "campus",
    "",
    "pr-previews/",
    "main-preview/",
    "main",
    "main-preview-old",
  ])("refuses to empty the place %o, and removes nothing", async (place) => {
    const store = await sharedStore();

    await expect(emptyPreviewFiles(store, place)).rejects.toThrow(
      "refused to empty them",
    );
    expect(store.files.size).toBe(ALL.length);
  });
});

describe("deployFiles", () => {
  it("empties the files of the PR previews on a PR deploy, as before", async () => {
    const store = await sharedStore();

    const done = await deployFiles(
      store,
      "pr-preview",
      "feat/uji",
      NEVER_ASKED,
    );

    expect(done).toBe("PR preview files emptied: 2 removed.");
    expect([...store.files.keys()]).toEqual([...OF_MAIN, ...OF_NO_PREVIEW]);
  });

  it("empties the files of main once, when its database was started over", async () => {
    const store = await sharedStore();
    const starts = startsOfMain(true);

    const first = await deployFiles(store, "main-preview", "main", starts);

    expect(first).toBe("Files of main emptied: 1 removed.");
    expect([...store.files.keys()]).toEqual([
      ...OF_PR_PREVIEWS,
      ...OF_NO_PREVIEW,
    ]);
    expect(starts.waiting).toBe(false);
    await store.put("main-preview/student-files/h", FILE);

    const second = await deployFiles(store, "main-preview", "main", starts);

    expect(second).toBe("Files of main kept.");
    expect(store.files.has("main-preview/student-files/h")).toBe(true);
  });

  it("keeps every file on a deploy of main that kept its data", async () => {
    const store = await sharedStore();

    const done = await deployFiles(
      store,
      "main-preview",
      "main",
      startsOfMain(false),
    );

    expect(done).toBe("Files of main kept.");
    expect(store.files.size).toBe(ALL.length);
  });

  it("leaves the start waiting when the files could not be emptied", async () => {
    const starts = startsOfMain(true);

    await expect(
      deployFiles(unreachableStore(), "main-preview", "main", starts),
    ).rejects.toThrow("cannot be reached");
    expect(starts.waiting).toBe(true);
  });

  it("does nothing, and says so, while the settings are empty", async () => {
    const starts = startsOfMain(true);

    expect(await deployFiles(null, "pr-preview", "feat/uji", NEVER_ASKED)).toBe(
      "The file storage settings are empty; no file is kept.",
    );
    expect(await deployFiles(null, "main-preview", "main", starts)).toBe(
      "The file storage settings are empty; no file is kept.",
    );
    expect(starts.waiting).toBe(true);
  });

  it("refuses a production deploy that does not come from main, as the database step does", async () => {
    const store = await sharedStore();
    const starts = startsOfMain(true);

    await expect(
      deployFiles(store, "main-preview", "feat/uji", starts),
    ).rejects.toThrow("refused");
    await expect(
      deployFiles(store, "main-preview", undefined, starts),
    ).rejects.toThrow("refused");
    expect(store.files.size).toBe(ALL.length);
    expect(starts.waiting).toBe(true);
  });

  it.each(["local", "campus"] as const)(
    "refuses to run in %s, and removes nothing",
    async (stage) => {
      const store = await sharedStore();

      await expect(
        deployFiles(store, stage, undefined, startsOfMain(true)),
      ).rejects.toThrow("runs only in a Vercel build");
      expect(store.files.size).toBe(ALL.length);
    },
  );
});
