import { describe, expect, it } from "vitest";
import {
  type DutyRights,
  isNeverJudged,
  offersOf,
  parseJudgement,
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
});
