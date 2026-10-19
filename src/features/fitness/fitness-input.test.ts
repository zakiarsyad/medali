import { describe, expect, it } from "vitest";
import {
  DAY_IN_FUTURE,
  FILE_DAY_IN_FUTURE,
  keepsPicked,
  LIMITS_NOT_DOWN,
  LIMITS_NOT_WHOLE,
  NO_SCORE,
  NO_TEST_DAY,
  pairedRows,
  parseFileTestDay,
  parseLimits,
  parseScores,
  parseTestDay,
  SCORE_NOT_WHOLE,
  scoreOf,
  testYearOf,
  yearStartOf,
} from "./fitness-input";

const ANI = "00000000-0000-4000-8000-000000000501";
const BUDI = "00000000-0000-4000-8000-000000000502";

describe("parseLimits", () => {
  it("takes whole limits from 1 to 100 that go down", () => {
    expect(
      parseLimits({ excellentFrom: "85", goodFrom: "75", attentionFrom: "55" }),
    ).toEqual({
      ok: true,
      value: { excellentFrom: 85, goodFrom: 75, attentionFrom: 55 },
    });
    expect(
      parseLimits({ excellentFrom: "100", goodFrom: "2", attentionFrom: "1" }),
    ).toEqual({
      ok: true,
      value: { excellentFrom: 100, goodFrom: 2, attentionFrom: 1 },
    });
  });

  it.each([
    ["Baik as high as Prima", "85", "85", "55"],
    ["Perlu perhatian above Baik", "85", "70", "71"],
    ["the order turned round", "55", "70", "85"],
  ])("refuses %s", (_, excellentFrom, goodFrom, attentionFrom) => {
    expect(parseLimits({ excellentFrom, goodFrom, attentionFrom })).toEqual({
      ok: false,
      error: LIMITS_NOT_DOWN,
    });
  });

  it.each(["0", "101", "72.5", "7a", "", " ", "-5", "085"])(
    "refuses a limit of %j",
    (typed) => {
      expect(
        parseLimits({
          excellentFrom: "90",
          goodFrom: typed,
          attentionFrom: "50",
        }),
      ).toEqual({ ok: false, error: LIMITS_NOT_WHOLE });
    },
  );

  it("says why in the words of the tab", () => {
    expect(LIMITS_NOT_DOWN).toBe(
      "Ambang harus menurun: prima > baik > perlu perhatian.",
    );
  });
});

describe("scoreOf", () => {
  it.each([
    ["0", 0],
    ["100", 100],
    ["72", 72],
    [" 72 ", 72],
  ])("reads %j as %i", (typed, score) => {
    expect(scoreOf(typed)).toBe(score);
  });

  it.each(["101", "-1", "72.5", "72,5", "abc", "", "007"])(
    "reads %j as no score",
    (typed) => {
      expect(scoreOf(typed)).toBeNull();
    },
  );
});

describe("parseScores", () => {
  it("keeps the filled scores and skips the empty fields", () => {
    expect(
      parseScores([
        { studentId: ANI, typed: "88" },
        { studentId: BUDI, typed: "  " },
      ]),
    ).toEqual({ ok: true, value: [{ studentId: ANI, score: 88 }] });
  });

  it("refuses a form with no score filled", () => {
    expect(parseScores([{ studentId: ANI, typed: "" }])).toEqual({
      ok: false,
      error: NO_SCORE,
    });
    expect(parseScores([])).toEqual({ ok: false, error: NO_SCORE });
  });

  it.each(["101", "-3", "72.5"])(
    "refuses the whole form when one score is %j",
    (typed) => {
      expect(
        parseScores([
          { studentId: ANI, typed: "80" },
          { studentId: BUDI, typed },
        ]),
      ).toEqual({ ok: false, error: SCORE_NOT_WHOLE });
    },
  );

  it("says why in the words of the tab", () => {
    expect(NO_SCORE).toBe("Isi minimal satu skor.");
    expect(SCORE_NOT_WHOLE).toBe("Skor harus bilangan bulat 0–100.");
  });
});

describe("parseFileTestDay", () => {
  const TODAY = "2026-10-16";

  it("takes today and a day before it", () => {
    expect(parseFileTestDay(TODAY, TODAY)).toEqual({ ok: true, value: TODAY });
    expect(parseFileTestDay("2026-10-15", TODAY)).toEqual({
      ok: true,
      value: "2026-10-15",
    });
  });

  it("refuses a day after today, saying what to do", () => {
    expect(parseFileTestDay("2026-10-17", TODAY)).toEqual({
      ok: false,
      error: FILE_DAY_IN_FUTURE,
    });
    expect(FILE_DAY_IN_FUTURE).toBe(
      "Tanggal tes tidak boleh setelah hari ini. Pilih hari ini atau tanggal sebelumnya.",
    );
  });

  it("refuses what is no day as the form does", () => {
    expect(parseFileTestDay("", TODAY)).toEqual({
      ok: false,
      error: NO_TEST_DAY,
    });
  });
});

describe("keepsPicked", () => {
  it("keeps the picked file after a refusal of its Tanggal tes, which can be changed and saved again", () => {
    expect(keepsPicked(FILE_DAY_IN_FUTURE)).toBe(true);
    expect(keepsPicked(NO_TEST_DAY)).toBe(true);
  });

  it("drops it after any other refusal", () => {
    expect(
      keepsPicked(
        "Tidak ada baris yang bisa disimpan. Periksa berkas, lalu unggah lagi.",
      ),
    ).toBe(false);
  });
});

describe("parseTestDay", () => {
  const TODAY = "2026-10-16";

  it("takes today and a day before it", () => {
    expect(parseTestDay(TODAY, TODAY)).toEqual({ ok: true, value: TODAY });
    expect(parseTestDay("2025-11-20", TODAY)).toEqual({
      ok: true,
      value: "2025-11-20",
    });
  });

  it("refuses a day after today", () => {
    expect(parseTestDay("2026-10-17", TODAY)).toEqual({
      ok: false,
      error: DAY_IN_FUTURE,
    });
    expect(DAY_IN_FUTURE).toBe("Tanggal tes tidak boleh setelah hari ini.");
  });

  it.each(["", "2026-02-30", "16-10-2026", "kemarin"])(
    "refuses %j, which is no day",
    (sent) => {
      expect(parseTestDay(sent, TODAY)).toEqual({
        ok: false,
        error: NO_TEST_DAY,
      });
    },
  );
});

describe("testYearOf", () => {
  it("gives the year of the day of the test", () => {
    expect(testYearOf("2026-10-16")).toBe(2026);
    expect(testYearOf("2025-12-31")).toBe(2025);
    expect(testYearOf("2026-01-01")).toBe(2026);
  });
});

describe("yearStartOf", () => {
  it("gives New Year's Day of the year of a day", () => {
    expect(yearStartOf("2026-10-16")).toBe("2026-01-01");
    expect(yearStartOf("2025-12-31")).toBe("2025-01-01");
  });
});

describe("pairedRows", () => {
  it("puts each student beside the score sent at the same place", () => {
    expect(pairedRows([ANI, BUDI], ["80", ""])).toEqual([
      { studentId: ANI, typed: "80" },
      { studentId: BUDI, typed: "" },
    ]);
  });

  it("gives nothing for lists of two lengths", () => {
    expect(pairedRows([ANI, BUDI], ["80"])).toBeNull();
    expect(pairedRows([ANI], ["80", "70"])).toBeNull();
  });
});
