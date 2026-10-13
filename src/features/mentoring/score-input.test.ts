import { describe, expect, it } from "vitest";
import {
  basedField,
  parseScores,
  readScore,
  type SentScores,
  scoreField,
  sentScores,
} from "./score-input";

const GROUP_ID = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7700";
const ANI = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7701";
const BUDI = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7702";

function sent(more: Partial<SentScores> = {}): SentScores {
  return {
    groupId: GROUP_ID,
    scores: [
      [ANI, "88", ""],
      [BUDI, "0", "70"],
    ],
    ...more,
  };
}

describe("readScore", () => {
  it.each([
    ["0", 0],
    ["7", 7],
    ["64", 64],
    ["100", 100],
    [" 85 ", 85],
    ["085", 85],
  ])("reads %o as %i", (text, score) => {
    expect(readScore(text)).toBe(score);
  });

  it.each([
    "",
    " ",
    "101",
    "150",
    "-1",
    "79.5",
    "79,5",
    "8e1",
    "+80",
    "delapan puluh",
    "80 poin",
    "1000",
    "0x50",
  ])("takes %o as no score", (text) => {
    expect(readScore(text)).toBeNull();
  });
});

describe("sentScores", () => {
  it("reads the score of each student whose box holds one", () => {
    const form = new FormData();
    form.set("groupId", GROUP_ID);
    form.set(scoreField(ANI), "88");
    form.set(scoreField(BUDI), "abc");

    expect(sentScores(form)).toEqual([
      [ANI, "88", ""],
      [BUDI, "abc", ""],
    ]);
  });

  it("reads beside each score the one its box was opened on, and none for a student without one", () => {
    const form = new FormData();
    form.set(scoreField(ANI), "88");
    form.set(basedField(ANI), "70");
    form.set(scoreField(BUDI), "60");
    form.set(basedField(BUDI), "");

    expect(sentScores(form)).toEqual([
      [ANI, "88", "70"],
      [BUDI, "60", ""],
    ]);
  });

  it("reads no score from what a box was opened on alone", () => {
    const form = new FormData();
    form.set(basedField(ANI), "70");

    expect(sentScores(form)).toEqual([]);
  });

  it("sends nothing for a box that is empty: a saved score cannot be emptied", () => {
    const form = new FormData();
    form.set(scoreField(ANI), "");
    form.set(scoreField(BUDI), "  ");

    expect(sentScores(form)).toEqual([]);
  });
});

describe("parseScores", () => {
  it("takes whole numbers from 0 to 100, one for each student", () => {
    expect(parseScores(sent())).toEqual({
      ok: true,
      value: {
        groupId: GROUP_ID,
        scores: { [ANI]: 88, [BUDI]: 0 },
        basedOn: { [ANI]: null, [BUDI]: 70 },
      },
    });
  });

  it.each(["101", "abc", "7.5"])(
    "refuses a save whose box was opened on %o, which is no score",
    (basedOn) => {
      const parsed = parseScores(sent({ scores: [[ANI, "88", basedOn]] }));

      expect(parsed.ok).toBe(false);
    },
  );

  it.each(["101", "-5", "79.5", "abc", "1e2"])(
    "refuses the whole save when one score is %o, and says what a score is",
    (score) => {
      const parsed = parseScores(
        sent({
          scores: [
            [ANI, "88", ""],
            [BUDI, score, ""],
          ],
        }),
      );

      expect(parsed.ok).toBe(false);
      expect(parsed).toMatchObject({
        error: expect.stringContaining("bilangan bulat dari 0 sampai 100"),
      });
    },
  );

  it("refuses a save without a score", () => {
    const parsed = parseScores(sent({ scores: [] }));

    expect(parsed).toEqual({
      ok: false,
      error: "Belum ada nilai yang diubah.",
    });
  });

  it.each(["", "semua", `${GROUP_ID}x`])(
    "refuses %o as the group",
    (groupId) => {
      expect(parseScores(sent({ groupId })).ok).toBe(false);
    },
  );

  it("refuses what is no id of a student", () => {
    const parsed = parseScores(sent({ scores: [["1 or 1=1", "80", ""]] }));

    expect(parsed.ok).toBe(false);
  });

  it("refuses a student who is sent twice", () => {
    const parsed = parseScores(
      sent({
        scores: [
          [ANI, "80", ""],
          [ANI, "90", ""],
        ],
      }),
    );

    expect(parsed.ok).toBe(false);
  });
});
