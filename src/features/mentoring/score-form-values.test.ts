import { describe, expect, it } from "vitest";
import {
  afterSave,
  boxState,
  boxText,
  hasUnsavedScores,
  idsToSend,
  saveButtonWords,
  spokenScore,
  withoutBoxes,
  withTyped,
} from "./score-form-values";

const SCORED = { id: "scored", score: 80 };
const UNSCORED = { id: "unscored", score: null };
const ROWS = [SCORED, UNSCORED];

describe("boxText", () => {
  it("shows the kept score, and nothing for a student without one", () => {
    expect(boxText(SCORED, {})).toBe("80");
    expect(boxText(UNSCORED, {})).toBe("");
  });

  it("shows what was typed, as it was typed", () => {
    expect(boxText(SCORED, { scored: "9o" })).toBe("9o");
    expect(boxText(SCORED, { scored: "" })).toBe("");
  });
});

describe("boxState", () => {
  it("is saved for a box nobody touched", () => {
    expect(boxState(SCORED, {})).toBe("saved");
    expect(boxState(UNSCORED, {})).toBe("saved");
  });

  it("is unsaved for another score than the one kept", () => {
    expect(boxState(SCORED, { scored: "85" })).toBe("unsaved");
    expect(boxState(UNSCORED, { unscored: "0" })).toBe("unsaved");
  });

  it("is saved again once the kept score is typed back", () => {
    expect(boxState(SCORED, { scored: "80" })).toBe("saved");
    expect(boxState(SCORED, { scored: " 80 " })).toBe("saved");
    expect(boxState(UNSCORED, { unscored: "" })).toBe("saved");
  });

  it.each(["101", "-1", "79.5", "abc"])(
    "is invalid for %o, which is no whole number from 0 to 100",
    (text) => {
      expect(boxState(SCORED, { scored: text })).toBe("invalid");
      expect(boxState(UNSCORED, { unscored: text })).toBe("invalid");
    },
  );

  it("is emptied for an empty box where a score is kept: a saved score is only changed", () => {
    expect(boxState(SCORED, { scored: "" })).toBe("emptied");
    expect(boxState(SCORED, { scored: "  " })).toBe("emptied");
  });
});

describe("spokenScore", () => {
  it("is the typed score while it is not saved, so the rubric follows the box", () => {
    expect(spokenScore(SCORED, { scored: "60" })).toBe(60);
    expect(spokenScore(UNSCORED, { unscored: "90" })).toBe(90);
  });

  it("is the kept score for a box that agrees with it", () => {
    expect(spokenScore(SCORED, {})).toBe(80);
    expect(spokenScore(UNSCORED, {})).toBeNull();
  });

  it("is none for a box that holds no score", () => {
    expect(spokenScore(SCORED, { scored: "150" })).toBeNull();
    expect(spokenScore(SCORED, { scored: "" })).toBeNull();
  });
});

describe("idsToSend", () => {
  it("sends nothing while nothing is changed", () => {
    expect(idsToSend(ROWS, {})).toEqual([]);
    expect(idsToSend(ROWS, { scored: "80" })).toEqual([]);
  });

  it("sends the changed boxes, also one that holds no score, for the server to refuse", () => {
    expect(idsToSend(ROWS, { scored: "85" })).toEqual(["scored"]);
    expect(idsToSend(ROWS, { scored: "85", unscored: "150" })).toEqual([
      "scored",
      "unscored",
    ]);
  });

  it("does not send an emptied box", () => {
    expect(idsToSend(ROWS, { scored: "" })).toEqual([]);
  });

  it("does not send a box of a student who is no longer in the list", () => {
    expect(idsToSend(ROWS, { gone: "70" })).toEqual([]);
  });
});

describe("hasUnsavedScores", () => {
  it("is false while every box agrees with what is kept", () => {
    expect(hasUnsavedScores(ROWS, {})).toBe(false);
    expect(hasUnsavedScores(ROWS, { scored: "80", unscored: "" })).toBe(false);
  });

  it("is true for a changed score, for what is no score and for an emptied box", () => {
    expect(hasUnsavedScores(ROWS, { unscored: "70" })).toBe(true);
    expect(hasUnsavedScores(ROWS, { unscored: "tujuh" })).toBe(true);
    expect(hasUnsavedScores(ROWS, { scored: "" })).toBe(true);
  });
});

describe("withTyped", () => {
  it("sets the text of one box and keeps the others", () => {
    expect(withTyped({ scored: "85" }, "unscored", "7")).toEqual({
      scored: "85",
      unscored: "7",
    });
  });
});

describe("afterSave", () => {
  it("forgets the boxes that were saved, so they show what is kept", () => {
    const typed = { scored: "85", unscored: "70" };

    expect(afterSave(typed, typed, ["scored", "unscored"])).toEqual({});
  });

  it("keeps a box that was not sent", () => {
    const typed = { scored: "85", unscored: "" };

    expect(afterSave(typed, typed, ["scored"])).toEqual({ unscored: "" });
  });

  it("keeps a box the person changed again while the save was on its way", () => {
    const sent = { scored: "85" };
    const typed = { scored: "86" };

    expect(afterSave(typed, sent, ["scored"])).toEqual({ scored: "86" });
  });
});

describe("withoutBoxes", () => {
  it("forgets what was typed for these students and keeps the rest", () => {
    const typed = { scored: "85", unscored: "70" };

    expect(withoutBoxes(typed, ["scored", "gone"])).toEqual({ unscored: "70" });
    expect(withoutBoxes(typed, [])).toEqual(typed);
  });
});

describe("saveButtonWords", () => {
  it("names how many scores the button saves", () => {
    expect(saveButtonWords(1)).toBe("Simpan 1 nilai");
    expect(saveButtonWords(12)).toBe("Simpan 12 nilai");
  });

  it("names no number while nothing is changed", () => {
    expect(saveButtonWords(0)).toBe("Simpan nilai");
  });
});
