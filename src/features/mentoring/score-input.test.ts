import { describe, expect, it } from "vitest";
import {
  basedField,
  keptKey,
  NOT_INDICATOR_SCORE,
  parseScores,
  readIndicatorScore,
  type SentScores,
  SOME_INCOMPLETE,
  scoreField,
  sentScores,
} from "./score-input";

const GROUP_ID = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7700";
const ANI = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7701";
const BUDI = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7702";

const SIX = ["4", "5", "4", "3", "5", "4"];

function sent(more: Partial<SentScores> = {}): SentScores {
  return {
    groupId: GROUP_ID,
    indicatorsVersion: "start",
    scores: [
      [ANI, SIX, ""],
      [BUDI, ["1", "1", "1", "1", "1", "1"], "70"],
    ],
    ...more,
  };
}

function setSix(form: FormData, studentId: string, six: string[]) {
  for (const [place, value] of six.entries()) {
    form.set(scoreField(studentId, place), value);
  }
}

describe("readIndicatorScore", () => {
  it.each([
    ["1", 1],
    ["3", 3],
    ["5", 5],
  ])("reads %o as %i", (text, score) => {
    expect(readIndicatorScore(text)).toBe(score);
  });

  it.each(["", " ", "0", "6", "10", "4.5", "-1", "empat", "05"])(
    "takes %o as no indicator score",
    (text) => {
      expect(readIndicatorScore(text)).toBeNull();
    },
  );
});

describe("keptKey", () => {
  it("tells a kept score by its six indicator scores, a score given before them by itself, and none by nothing", () => {
    expect(keptKey({ score: 83.3, indicatorScores: [4, 5, 4, 3, 5, 4] })).toBe(
      "4,5,4,3,5,4",
    );
    expect(keptKey({ score: 80, indicatorScores: null })).toBe("80");
    expect(keptKey(null)).toBe("");
  });
});

describe("sentScores", () => {
  it("reads the six choices of each student that is sent, an empty choice as empty", () => {
    const form = new FormData();
    form.set("groupId", GROUP_ID);
    setSix(form, ANI, SIX);
    setSix(form, BUDI, ["4", "", "4", "4", "", "4"]);

    expect(sentScores(form)).toEqual([
      [ANI, SIX, ""],
      [BUDI, ["4", "", "4", "4", "", "4"], ""],
    ]);
  });

  it("reads beside the six what the row was opened on", () => {
    const form = new FormData();
    setSix(form, ANI, SIX);
    form.set(basedField(ANI), "80");

    expect(sentScores(form)).toEqual([[ANI, SIX, "80"]]);
  });

  it("reads nothing from what a row was opened on alone", () => {
    const form = new FormData();
    form.set(basedField(ANI), "80");

    expect(sentScores(form)).toEqual([]);
  });
});

describe("parseScores", () => {
  it("takes six whole numbers from 1 to 5 for each student, with what each row was opened on", () => {
    expect(parseScores(sent())).toEqual({
      ok: true,
      value: {
        groupId: GROUP_ID,
        indicatorsVersion: "start",
        scores: { [ANI]: [4, 5, 4, 3, 5, 4], [BUDI]: [1, 1, 1, 1, 1, 1] },
        basedOn: { [ANI]: "", [BUDI]: "70" },
      },
    });
  });

  it("refuses the whole save when a student has only part of the six", () => {
    const parsed = parseScores(
      sent({
        scores: [
          [ANI, SIX, ""],
          [BUDI, ["4", "", "4", "4", "4", "4"], ""],
        ],
      }),
    );

    expect(parsed).toEqual({ ok: false, error: SOME_INCOMPLETE });
  });

  it("refuses the whole save when a choice is no whole number from 1 to 5", () => {
    const parsed = parseScores(
      sent({ scores: [[ANI, ["4", "5", "4", "3", "5", "9"], ""]] }),
    );

    expect(parsed).toEqual({ ok: false, error: NOT_INDICATOR_SCORE });
  });

  it("refuses a save without a score", () => {
    expect(parseScores(sent({ scores: [] })).ok).toBe(false);
  });

  it("refuses what is no id of a student or of a group, a student sent twice, and an opening that is no kept score", () => {
    expect(parseScores(sent({ groupId: "kelompok" })).ok).toBe(false);
    expect(parseScores(sent({ indicatorsVersion: "" })).ok).toBe(false);
    expect(parseScores(sent({ indicatorsVersion: "lama" })).ok).toBe(false);
    expect(parseScores(sent({ indicatorsVersion: GROUP_ID })).ok).toBe(true);
    expect(parseScores(sent({ scores: [["ani", SIX, ""]] })).ok).toBe(false);
    expect(
      parseScores(
        sent({
          scores: [
            [ANI, SIX, ""],
            [ANI, SIX, ""],
          ],
        }),
      ).ok,
    ).toBe(false);
    expect(parseScores(sent({ scores: [[ANI, SIX, "banyak"]] })).ok).toBe(
      false,
    );
  });
});
