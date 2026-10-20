import { describe, expect, it } from "vitest";
import { forgetSurveyDrafts, surveyDraftKey } from "./survey-drafts";

/** A storage of the device that holds what it is given. */
function memory(entries: Record<string, string>): Storage {
  const kept = new Map(Object.entries(entries));
  return {
    get length() {
      return kept.size;
    },
    clear: () => kept.clear(),
    getItem: (key) => kept.get(key) ?? null,
    key: (index) => [...kept.keys()][index] ?? null,
    removeItem: (key) => {
      kept.delete(key);
    },
    setItem: (key, value) => {
      kept.set(key, value);
    },
  };
}

function keysOf(storage: Storage): string[] {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index++) {
    keys.push(storage.key(index) ?? "");
  }
  return keys;
}

const OWN = surveyDraftKey("student-1", "period-2");
const EARLIER_PERIOD = surveyDraftKey("student-1", "period-1");
const OTHER_STUDENT = surveyDraftKey("student-2", "period-2");
const OTHER_THING = "medali:tema";

function filled(): Storage {
  return memory({
    [OWN]: "{}",
    [EARLIER_PERIOD]: "{}",
    [OTHER_STUDENT]: "{}",
    [OTHER_THING]: "gelap",
  });
}

describe("surveyDraftKey", () => {
  it("is one per student and period, all under one name", () => {
    expect(OWN).toBe("medali:survei:student-1:period-2");
    expect(OWN).not.toBe(EARLIER_PERIOD);
    expect(OWN).not.toBe(OTHER_STUDENT);
  });
});

describe("forgetSurveyDrafts", () => {
  it("forgets every survey draft but the one kept, and nothing else", () => {
    const storage = filled();

    forgetSurveyDrafts(storage, OWN);

    expect(keysOf(storage).sort()).toEqual([OTHER_THING, OWN].sort());
  });

  it("forgets every survey draft when none is kept, as at sign-out", () => {
    const storage = filled();

    forgetSurveyDrafts(storage, null);

    expect(keysOf(storage)).toEqual([OTHER_THING]);
  });

  it("never breaks the page on a device that keeps nothing or refuses", () => {
    const refusing = {
      ...memory({}),
      get length(): number {
        throw new Error("refused");
      },
    } as Storage;

    expect(() => forgetSurveyDrafts(null, null)).not.toThrow();
    expect(() => forgetSurveyDrafts(refusing, OWN)).not.toThrow();
  });
});
