import { describe, expect, it } from "vitest";
import {
  bulkButtonWords,
  bulkDoneWords,
  bulkQuestion,
  sentIds,
  tickableIds,
  tickedOf,
  ticksAfter,
} from "./bulk-validation";
import { TEST_CARD } from "./test-verification";

const WAITING = { ...TEST_CARD, id: "card-waiting" };
const OTHER = { ...TEST_CARD, id: "card-other" };
const DECIDED = { ...TEST_CARD, id: "card-decided", status: "valid" as const };

describe("the ticks on the photo cards", () => {
  it("can be put only on cards that still wait", () => {
    expect(tickableIds([WAITING, DECIDED, OTHER])).toEqual([
      "card-waiting",
      "card-other",
    ]);
  });

  it("drop a card that was decided since it was ticked, or that is not on the page", () => {
    const ticked = ["card-decided", "card-other", "card-elsewhere"];

    expect(tickedOf(ticked, [WAITING, DECIDED, OTHER])).toEqual(["card-other"]);
  });

  it("add a card once and clear it again", () => {
    const once = ticksAfter(ticksAfter([], "a", true), "a", true);

    expect(once).toEqual(["a"]);
    expect(ticksAfter(["a", "b"], "a", false)).toEqual(["b"]);
  });
});

describe("the words of validating many photos", () => {
  it("name how many are ticked on the button and in the question", () => {
    expect(bulkButtonWords(0)).toBe("Validasi terpilih");
    expect(bulkButtonWords(3)).toBe("Validasi 3 terpilih");
    expect(bulkQuestion(3)).toBe("Validasi 3 presensi terpilih?");
  });

  it("say how many were validated, and how many were decided in the meantime", () => {
    expect(bulkDoneWords({ validated: 3, decidedBefore: 0 })).toBe(
      "3 presensi divalidasi.",
    );
    expect(bulkDoneWords({ validated: 2, decidedBefore: 1 })).toBe(
      "2 presensi divalidasi. 1 sudah diputuskan sebelumnya.",
    );
  });
});

describe("sentIds", () => {
  it("reads only a list of texts, each key once", () => {
    expect(sentIds(["a", "b", "a", 7, null])).toEqual(["a", "b"]);
    expect(sentIds("a")).toEqual([]);
    expect(sentIds(undefined)).toEqual([]);
    expect(sentIds({ length: 1, 0: "a" })).toEqual([]);
  });
});
