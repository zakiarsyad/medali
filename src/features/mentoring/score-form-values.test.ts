import { describe, expect, it } from "vitest";
import {
  afterSave,
  choiceText,
  hasUnsavedScores,
  idsToSend,
  rowState,
  saveButtonWords,
  spokenScore,
  withoutBoxes,
  withTyped,
} from "./score-form-values";

const SIX = { id: "six", score: 83.3, indicatorScores: [4, 5, 4, 3, 5, 4] };
const BEFORE = { id: "before", score: 80, indicatorScores: null };
const UNSCORED = { id: "unscored", score: null, indicatorScores: null };
const ROWS = [SIX, BEFORE, UNSCORED];

const ALL_FIVE = ["5", "5", "5", "5", "5", "5"];
const EMPTY = ["", "", "", "", "", ""];

describe("choiceText", () => {
  it("shows the kept indicator score, and nothing for a row without six", () => {
    expect(choiceText(SIX, {}, 1)).toBe("5");
    expect(choiceText(BEFORE, {}, 1)).toBe("");
    expect(choiceText(UNSCORED, {}, 1)).toBe("");
  });

  it("shows what was chosen", () => {
    expect(choiceText(SIX, { six: ALL_FIVE }, 3)).toBe("5");
  });
});

describe("rowState", () => {
  it("is saved for a row nobody touched", () => {
    for (const row of ROWS) expect(rowState(row, {})).toBe("saved");
  });

  it("is unsaved once six are chosen that are not the ones kept", () => {
    expect(rowState(SIX, { six: ALL_FIVE })).toBe("unsaved");
    expect(rowState(BEFORE, { before: ALL_FIVE })).toBe("unsaved");
    expect(rowState(UNSCORED, { unscored: ALL_FIVE })).toBe("unsaved");
  });

  it("is saved again once the six kept are chosen back", () => {
    expect(rowState(SIX, { six: ["4", "5", "4", "3", "5", "4"] })).toBe(
      "saved",
    );
  });

  it("is incomplete while only part of the six are chosen", () => {
    const part = ["4", "", "4", "4", "4", "4"];

    expect(rowState(UNSCORED, { unscored: part })).toBe("incomplete");
    expect(rowState(BEFORE, { before: part })).toBe("incomplete");
    expect(rowState(SIX, { six: part })).toBe("incomplete");
  });

  it("is saved for a row without six whose choices are all emptied again, and incomplete for one with six", () => {
    expect(rowState(UNSCORED, { unscored: EMPTY })).toBe("saved");
    expect(rowState(BEFORE, { before: EMPTY })).toBe("saved");
    expect(rowState(SIX, { six: EMPTY })).toBe("incomplete");
  });
});

describe("spokenScore", () => {
  it("is the final score of the six chosen while they are not saved, so Nilai akhir follows them at once", () => {
    expect(spokenScore(UNSCORED, { unscored: ALL_FIVE })).toBe(100);
    expect(
      spokenScore(UNSCORED, { unscored: ["4", "5", "4", "3", "5", "4"] }),
    ).toBe(83.3);
    expect(
      spokenScore(UNSCORED, { unscored: ["1", "1", "1", "1", "1", "1"] }),
    ).toBe(20);
  });

  it("is the kept score for a row that agrees with it, one given before the indicators among them", () => {
    expect(spokenScore(SIX, {})).toBe(83.3);
    expect(spokenScore(BEFORE, {})).toBe(80);
    expect(spokenScore(UNSCORED, {})).toBeNull();
  });

  it("is none for a row with only part of the six", () => {
    expect(spokenScore(SIX, { six: ["4", "", "4", "3", "5", "4"] })).toBeNull();
  });
});

describe("idsToSend", () => {
  it("sends nothing while nothing is changed", () => {
    expect(idsToSend(ROWS, {})).toEqual([]);
  });

  it("sends the changed rows, also one with only part of the six, for the server to refuse", () => {
    expect(
      idsToSend(ROWS, {
        six: ALL_FIVE,
        unscored: ["4", "", "", "", "", ""],
      }),
    ).toEqual(["six", "unscored"]);
  });

  it("does not send a row of a student who is no longer in the list", () => {
    expect(idsToSend(ROWS, { gone: ALL_FIVE })).toEqual([]);
  });
});

describe("hasUnsavedScores", () => {
  it("is false while every row agrees with what is kept", () => {
    expect(hasUnsavedScores(ROWS, {})).toBe(false);
    expect(hasUnsavedScores(ROWS, { before: EMPTY })).toBe(false);
  });

  it("is true for six changed and for part of the six", () => {
    expect(hasUnsavedScores(ROWS, { six: ALL_FIVE })).toBe(true);
    expect(hasUnsavedScores(ROWS, { before: ["4", "", "", "", "", ""] })).toBe(
      true,
    );
  });
});

describe("withTyped", () => {
  it("sets one choice of a row, starting from the six kept, and keeps the other rows", () => {
    const typed = withTyped({ before: ALL_FIVE }, SIX, 0, "1");

    expect(typed).toEqual({
      before: ALL_FIVE,
      six: ["1", "5", "4", "3", "5", "4"],
    });
  });
});

describe("afterSave", () => {
  it("forgets the rows that were saved, so they show what is kept", () => {
    const typed = { six: ALL_FIVE };

    expect(afterSave(typed, typed, ["six"])).toEqual({});
  });

  it("keeps a row that was not sent", () => {
    const typed = { six: ALL_FIVE, before: ["4", "", "", "", "", ""] };

    expect(afterSave(typed, typed, ["six"])).toEqual({
      before: ["4", "", "", "", "", ""],
    });
  });

  it("keeps a row the person changed again while the save was on its way", () => {
    const sent = { six: ALL_FIVE };
    const now = { six: ["1", "5", "5", "5", "5", "5"] };

    expect(afterSave(now, sent, ["six"])).toEqual(now);
  });
});

describe("withoutBoxes", () => {
  it("forgets what was chosen for these students and keeps the rest", () => {
    expect(withoutBoxes({ six: ALL_FIVE, before: ALL_FIVE }, ["six"])).toEqual({
      before: ALL_FIVE,
    });
  });
});

describe("saveButtonWords", () => {
  it("names how many scores the button saves", () => {
    expect(saveButtonWords(3)).toBe("Simpan 3 nilai");
  });

  it("names no number while nothing is changed", () => {
    expect(saveButtonWords(0)).toBe("Simpan nilai");
  });
});
