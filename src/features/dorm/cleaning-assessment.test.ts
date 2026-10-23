import { describe, expect, it } from "vitest";
import {
  type DutyRights,
  isNeverJudged,
  offersOf,
  parseJudgement,
  parseSendBackReason,
  rankNumber,
  resultWithPoints,
  scoreOf,
  scoreWords,
  shownResult,
} from "./cleaning-assessment";

const TODAY = "2026-10-15";
const NONE: DutyRights = { judge: false, validate: false, manage: false };
const SCHEDULED = { status: "scheduled", sentBackReason: "" } as const;

describe("parseJudgement", () => {
  it("takes Memenuhi with or without a note, without the spaces around it", () => {
    expect(parseJudgement("met", "")).toEqual({
      ok: true,
      value: { result: "met", note: "" },
    });
    expect(parseJudgement("met", "  Rapi.  ")).toEqual({
      ok: true,
      value: { result: "met", note: "Rapi." },
    });
  });

  it("takes Tidak memenuhi with a note on what is not clean", () => {
    expect(parseJudgement("not_met", "Lantai belum dipel.")).toEqual({
      ok: true,
      value: { result: "not_met", note: "Lantai belum dipel." },
    });
  });

  it("refuses Tidak memenuhi without a note, or with spaces only", () => {
    const refused = {
      ok: false,
      error: "Tulis catatan bagian yang belum bersih.",
    };
    expect(parseJudgement("not_met", "")).toEqual(refused);
    expect(parseJudgement("not_met", "   ")).toEqual(refused);
    expect(parseJudgement("not_met", undefined)).toEqual(refused);
  });

  it("refuses a result that is not one of the two", () => {
    expect(parseJudgement("validated", "")).toEqual({
      ok: false,
      error: "Pilih Memenuhi atau Tidak memenuhi.",
    });
  });

  it("refuses a note longer than 200 letters, counting an emoji as one", () => {
    expect(parseJudgement("met", "a".repeat(200)).ok).toBe(true);
    expect(parseJudgement("met", "😀".repeat(200)).ok).toBe(true);
    expect(parseJudgement("met", "a".repeat(201))).toEqual({
      ok: false,
      error: "Catatan paling banyak 200 huruf.",
    });
  });
});

describe("the score of a room", () => {
  it("is +1 for each Memenuhi and −1 for each Tidak memenuhi", () => {
    expect(scoreOf(0, 0)).toBe(0);
    expect(scoreOf(5, 2)).toBe(3);
    expect(scoreOf(1, 4)).toBe(-3);
  });

  it("is said with its sign, and a true minus sign", () => {
    expect(scoreWords(3)).toBe("+3");
    expect(scoreWords(0)).toBe("0");
    expect(scoreWords(-2)).toBe("−2");
  });

  it("numbers the rows of a later page after those of the pages before", () => {
    expect(rankNumber(1, 20, 0)).toBe(1);
    expect(rankNumber(2, 20, 0)).toBe(21);
    expect(rankNumber(3, 20, 4)).toBe(45);
  });
});

describe("what a resident sees of a judgement", () => {
  it("names a validated result with its points", () => {
    expect(resultWithPoints("met")).toBe("Memenuhi (+1)");
    expect(resultWithPoints("not_met")).toBe("Tidak memenuhi (−1)");
  });

  it("shows the result and its note only once it is validated", () => {
    const judged = {
      status: "judged",
      result: "not_met",
      judgeNote: "Kotor.",
    } as const;
    expect(shownResult(judged)).toBeNull();
    expect(shownResult({ ...judged, status: "validated" })).toEqual({
      result: "not_met",
      note: "Kotor.",
    });
    expect(
      shownResult({ status: "scheduled", result: null, judgeNote: "" }),
    ).toBeNull();
  });
});

describe("parseSendBackReason", () => {
  const needed = {
    ok: false,
    error: "Tulis alasan penolakan minimal 5 huruf.",
  };

  it("takes a reason of 5 letters or more, without the spaces around it", () => {
    expect(parseSendBackReason("  Kurang  ")).toEqual({
      ok: true,
      value: "Kurang",
    });
    expect(parseSendBackReason("Ulang")).toEqual({ ok: true, value: "Ulang" });
  });

  it("refuses a reason under 5 letters, an empty one and one that is not a text", () => {
    expect(parseSendBackReason("Ulan")).toEqual(needed);
    expect(parseSendBackReason("   ")).toEqual(needed);
    expect(parseSendBackReason(undefined)).toEqual(needed);
  });

  it("refuses a reason longer than 200 letters", () => {
    expect(parseSendBackReason("a".repeat(200)).ok).toBe(true);
    expect(parseSendBackReason("a".repeat(201))).toEqual({
      ok: false,
      error: "Alasan penolakan paling banyak 200 huruf.",
    });
  });
});

describe("isNeverJudged", () => {
  it("is true only for a duty that is Terjadwal and was never sent back", () => {
    expect(isNeverJudged(SCHEDULED)).toBe(true);
    expect(
      isNeverJudged({ status: "scheduled", sentBackReason: "Belum dicek." }),
    ).toBe(false);
    expect(isNeverJudged({ status: "judged", sentBackReason: "" })).toBe(false);
    expect(isNeverJudged({ status: "validated", sentBackReason: "" })).toBe(
      false,
    );
  });
});

describe("offersOf", () => {
  const judge = { ...NONE, judge: true };

  it("offers judging a Terjadwal duty of today or before to a judge", () => {
    expect(offersOf(SCHEDULED, TODAY, TODAY, judge).judge).toBe(true);
    expect(offersOf(SCHEDULED, "2026-10-14", TODAY, judge).judge).toBe(true);
  });

  it("offers no judging of a duty of a later date", () => {
    expect(offersOf(SCHEDULED, "2026-10-16", TODAY, judge).judge).toBe(false);
  });

  it("offers no judging of a judged duty, nor to a role without the right", () => {
    const judged = { status: "judged", sentBackReason: "" } as const;
    expect(offersOf(judged, TODAY, TODAY, judge).judge).toBe(false);
    expect(offersOf(SCHEDULED, TODAY, TODAY, NONE).judge).toBe(false);
  });

  it("offers validating only a duty Dinilai BAM, to a role with the right", () => {
    const validate = { ...NONE, validate: true };
    const judged = { status: "judged", sentBackReason: "" } as const;
    const validated = { status: "validated", sentBackReason: "" } as const;
    expect(offersOf(judged, TODAY, TODAY, validate).validate).toBe(true);
    expect(offersOf(SCHEDULED, TODAY, TODAY, validate).validate).toBe(false);
    expect(offersOf(validated, TODAY, TODAY, validate).validate).toBe(false);
    expect(offersOf(judged, TODAY, TODAY, judge).validate).toBe(false);
  });

  it("offers Batalkan tugas only for a duty of today or later that was never judged", () => {
    const manage = { ...NONE, manage: true };
    const sentBack = { status: "scheduled", sentBackReason: "Ulang." } as const;
    const judged = { status: "judged", sentBackReason: "" } as const;
    expect(offersOf(SCHEDULED, TODAY, TODAY, manage).cancel).toBe(true);
    expect(offersOf(SCHEDULED, "2026-10-14", TODAY, manage).cancel).toBe(false);
    expect(offersOf(judged, TODAY, TODAY, manage).cancel).toBe(false);
    expect(offersOf(sentBack, TODAY, TODAY, manage).cancel).toBe(false);
    expect(offersOf(SCHEDULED, TODAY, TODAY, judge).cancel).toBe(false);
  });

  it("offers no judging and no Batalkan tugas on a duty of the account's own room, but the line in their place", () => {
    const all = { judge: true, validate: true, manage: true };
    const judged = { status: "judged", sentBackReason: "" } as const;

    expect(offersOf(SCHEDULED, TODAY, TODAY, all, true)).toEqual({
      judge: false,
      validate: false,
      cancel: false,
      ownLine: true,
    });
    expect(offersOf(judged, TODAY, TODAY, all, true)).toEqual({
      judge: false,
      validate: true,
      cancel: false,
      ownLine: false,
    });
    expect(offersOf(SCHEDULED, TODAY, TODAY, all).ownLine).toBe(false);
  });
});
