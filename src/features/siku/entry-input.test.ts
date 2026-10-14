import { describe, expect, it } from "vitest";
import {
  BASIS_TOO_LONG,
  DAY_IN_FUTURE,
  NEEDS_BASIS,
  NEEDS_STUDENT,
  NO_DAY,
  NO_KIND,
  NO_REASON,
  NOTE_TOO_LONG,
  POINTS_OUTSIDE,
  parseEntry,
  type SentEntry,
  TOO_MANY_STUDENTS,
} from "./entry-input";

const TODAY = "2026-10-14";
const ANI = "0b8f3c1e-0000-4000-8000-000000000001";
const BUDI = "0b8f3c1e-0000-4000-8000-000000000002";

function sent(more: Partial<SentEntry> = {}): SentEntry {
  return {
    kind: "gain",
    reason: "peer_mentoring",
    points: "2",
    day: "2026-10-13",
    note: " Tutor sebaya ",
    basis: "",
    studentIds: [ANI, BUDI],
    ...more,
  };
}

describe("parseEntry", () => {
  it("checks a gain with everything in order, trimming the words", () => {
    expect(parseEntry(sent(), TODAY)).toEqual({
      ok: true,
      value: {
        kind: "gain",
        reason: "peer_mentoring",
        points: 2,
        day: "2026-10-13",
        note: "Tutor sebaya",
        basis: "",
        studentIds: [ANI, BUDI],
      },
    });
  });

  it("refuses no student first, then points outside 1 to 30", () => {
    expect(parseEntry(sent({ studentIds: [], points: "0" }), TODAY)).toEqual({
      ok: false,
      error: NEEDS_STUDENT,
    });
    expect(NEEDS_STUDENT).toBe("Pilih minimal satu mahasiswa.");
    for (const points of ["0", "31", "2.5", "", "-3", "dua"]) {
      expect(parseEntry(sent({ points }), TODAY)).toEqual({
        ok: false,
        error: POINTS_OUTSIDE,
      });
    }
    expect(POINTS_OUTSIDE).toBe("Poin 1–30.");
    expect(parseEntry(sent({ points: "30" }), TODAY).ok).toBe(true);
    expect(parseEntry(sent({ points: "1" }), TODAY).ok).toBe(true);
  });

  it("refuses a kind or a reason that is not on the lists, and a reason of the other kind", () => {
    expect(parseEntry(sent({ kind: "bonus" }), TODAY)).toEqual({
      ok: false,
      error: NO_KIND,
    });
    expect(parseEntry(sent({ reason: "lain" }), TODAY)).toEqual({
      ok: false,
      error: NO_REASON,
    });
    expect(
      parseEntry(sent({ kind: "loss", reason: "peer_mentoring" }), TODAY),
    ).toEqual({ ok: false, error: NO_REASON });
  });

  it("refuses a day that is no day, and a day after today", () => {
    expect(parseEntry(sent({ day: "" }), TODAY)).toEqual({
      ok: false,
      error: NO_DAY,
    });
    expect(parseEntry(sent({ day: "2026-02-30" }), TODAY)).toEqual({
      ok: false,
      error: NO_DAY,
    });
    expect(parseEntry(sent({ day: "2026-10-15" }), TODAY)).toEqual({
      ok: false,
      error: DAY_IN_FUTURE,
    });
    expect(parseEntry(sent({ day: TODAY }), TODAY).ok).toBe(true);
  });

  it("asks a decision of the Direktur for its letter, and drops a letter sent with any other reason", () => {
    const decision = { kind: "loss", reason: "director_decision" };

    expect(parseEntry(sent({ ...decision, basis: "  " }), TODAY)).toEqual({
      ok: false,
      error: NEEDS_BASIS,
    });
    expect(NEEDS_BASIS).toBe("Isi dasar atau nomor surat keputusan.");
    const withLetter = parseEntry(
      sent({ ...decision, basis: " SK-01 " }),
      TODAY,
    );
    expect(withLetter.ok && withLetter.value.basis).toBe("SK-01");
    const other = parseEntry(sent({ basis: "SK-01" }), TODAY);
    expect(other.ok && other.value.basis).toBe("");
  });

  it("refuses words longer than the fields take", () => {
    expect(parseEntry(sent({ note: "a".repeat(501) }), TODAY)).toEqual({
      ok: false,
      error: NOTE_TOO_LONG,
    });
    expect(
      parseEntry(
        sent({
          kind: "loss",
          reason: "director_decision",
          basis: "a".repeat(201),
        }),
        TODAY,
      ),
    ).toEqual({ ok: false, error: BASIS_TOO_LONG });
  });

  it("keeps a student sent twice once, and refuses what is no student and too many", () => {
    const twice = parseEntry(sent({ studentIds: [ANI, ANI, BUDI] }), TODAY);
    expect(twice.ok && twice.value.studentIds).toEqual([ANI, BUDI]);
    expect(parseEntry(sent({ studentIds: ["bukan"] }), TODAY)).toEqual({
      ok: false,
      error: NEEDS_STUDENT,
    });
    const many = Array.from(
      { length: 2001 },
      (_, place) =>
        `0b8f3c1e-0000-4000-8000-${String(place).padStart(12, "0")}`,
    );
    expect(parseEntry(sent({ studentIds: many }), TODAY)).toEqual({
      ok: false,
      error: TOO_MANY_STUDENTS,
    });
  });
});
