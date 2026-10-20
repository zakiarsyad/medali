import { describe, expect, it } from "vitest";
import {
  dropDraft,
  keepDraft,
  readDraft,
  surveyDraftKey,
} from "./survey-draft";

/** A storage of the device that holds what it is given. */
function memory(): Storage {
  const kept = new Map<string, string>();
  return {
    get length() {
      return kept.size;
    },
    clear: () => kept.clear(),
    getItem: (key) => kept.get(key) ?? null,
    key: () => null,
    removeItem: (key) => {
      kept.delete(key);
    },
    setItem: (key, value) => {
      kept.set(key, value);
    },
  };
}

/** A storage that refuses everything, as a private window may. */
const REFUSING: Storage = {
  length: 0,
  clear: () => {},
  getItem: () => {
    throw new Error("refused");
  },
  key: () => null,
  removeItem: () => {
    throw new Error("refused");
  },
  setItem: () => {
    throw new Error("refused");
  },
};

const KEY = surveyDraftKey("student-1", "period-1");
const DRAFT = { scores: [5, 0, 3, 0, 0, 0, 0, 0], suggestion: "Lanjut" };

describe("the half-filled survey kept on the device", () => {
  it("is kept per student and period", () => {
    expect(surveyDraftKey("student-1", "period-1")).not.toBe(
      surveyDraftKey("student-1", "period-2"),
    );
    expect(surveyDraftKey("student-1", "period-1")).not.toBe(
      surveyDraftKey("student-2", "period-1"),
    );
  });

  it("comes back as it was kept", () => {
    const storage = memory();
    keepDraft(storage, KEY, DRAFT);

    expect(readDraft(storage, KEY)).toEqual(DRAFT);
  });

  it("is gone once dropped", () => {
    const storage = memory();
    keepDraft(storage, KEY, DRAFT);
    dropDraft(storage, KEY);

    expect(readDraft(storage, KEY)).toBe(null);
  });

  it("is nothing when the device keeps nothing or refuses, and never breaks the page", () => {
    expect(readDraft(null, KEY)).toBe(null);
    expect(readDraft(REFUSING, KEY)).toBe(null);
    expect(() => keepDraft(REFUSING, KEY, DRAFT)).not.toThrow();
    expect(() => dropDraft(REFUSING, KEY)).not.toThrow();
  });

  it("is nothing when what is kept is not a draft", () => {
    const storage = memory();
    storage.setItem(KEY, "{not json");
    expect(readDraft(storage, KEY)).toBe(null);
    storage.setItem(KEY, JSON.stringify({ scores: [9, 9], suggestion: 1 }));
    expect(readDraft(storage, KEY)).toBe(null);
  });

  it("keeps only the scores that are scores", () => {
    const storage = memory();
    storage.setItem(
      KEY,
      JSON.stringify({ scores: [5, 9, "x", 2], suggestion: "a" }),
    );

    expect(readDraft(storage, KEY)).toEqual({
      scores: [5, 0, 0, 2, 0, 0, 0, 0],
      suggestion: "a",
    });
  });
});
