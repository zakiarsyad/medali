import { describe, expect, it } from "vitest";
import type { FitnessTally } from "@/health-notes/fitness-recap";
import type { RecapRow } from "@/health-notes/sick-list";
import {
  careRowOf,
  dormMentalOf,
  dormPhysicalOf,
} from "./dashboard-health-recap";

function tally(
  students: number,
  tested: number,
  byCategory: FitnessTally["byCategory"],
): FitnessTally {
  return { students, tested, byCategory };
}

const NO_CATEGORY = { excellent: 0, good: 0, attention: 0, medical: 0 };

const ROW: RecapRow = {
  id: "s1",
  name: "Penghuni Contoh",
  nim: "9911000001",
  program: "Prodi Contoh",
  dorm: "dana_rakca",
  room: { dorm: "dana_rakca", floor: 2, number: "12" },
  mentorName: "Pengasuh Contoh",
  final: { category: "medical", fromNote: true },
  note: null,
};

describe("careRowOf", () => {
  it("keeps only the name, the room, the category and the note written out", () => {
    expect(careRowOf(ROW)).toEqual({
      id: "s1",
      name: "Penghuni Contoh",
      room: "Dana Rakca, lantai 2, kamar 12",
      final: { category: "medical", fromNote: true },
      note: null,
    });
  });

  it("writes the last note out as Kesehatan does", () => {
    const row = careRowOf({
      ...ROW,
      note: {
        id: "n1",
        examinedOn: "2026-10-12",
        examiner: null,
        savedBy: "Akun Contoh",
        illnesses: [{ illness: "asthma", note: "" }],
        otherHistory: "",
        medicine: "",
        advice: "Kontrol rutin.",
        category: "attention",
      },
    });

    expect(row.note).toBe("Riwayat: Asma. Kontrol rutin.");
  });
});

describe("dormMentalOf", () => {
  const SHOWN = {
    kind: "shown",
    assessed: 12,
    byLevel: {
      normal: 8,
      mild: "<5",
      moderate: "<5",
      severe: 0,
      extremely_severe: 0,
    },
  } as const;

  it("sends the sessions with the levels, 1 to 4 as <5", () => {
    expect(dormMentalOf(SHOWN, 12)).toEqual({ recap: SHOWN, sessions: 12 });
    expect(dormMentalOf(SHOWN, 3)).toEqual({ recap: SHOWN, sessions: "<5" });
    expect(dormMentalOf(SHOWN, 0)).toEqual({ recap: SHOWN, sessions: 0 });
  });

  it("sends no session count while the levels show none", () => {
    expect(dormMentalOf({ kind: "too_few" }, 9)).toEqual({
      recap: { kind: "too_few" },
      sessions: null,
    });
    expect(dormMentalOf({ kind: "none" }, 9)).toEqual({
      recap: { kind: "none" },
      sessions: null,
    });
  });
});

describe("dormPhysicalOf", () => {
  it("adds the dorms up for the bars and gives each dorm its own counts, each of 1 to 4 as <5", () => {
    const physical = dormPhysicalOf([
      {
        key: "dana_rakca",
        tally: tally(10, 9, {
          excellent: 5,
          good: 2,
          attention: 1,
          medical: 1,
        }),
      },
      {
        key: "cipta_bakti",
        tally: tally(2, 2, { ...NO_CATEGORY, excellent: 2 }),
      },
    ]);

    expect(physical.recap).toMatchObject({
      kind: "shown",
      students: 12,
      tested: 11,
      byCategory: { excellent: 7, good: "<5", attention: "<5", medical: "<5" },
      illnesses: null,
    });
    expect(physical.byDorm).toEqual({
      wismantara_putra: NO_CATEGORY,
      wismantara_putri: NO_CATEGORY,
      dana_rakca: { excellent: 5, good: "<5", attention: "<5", medical: "<5" },
      cipta_bakti: { ...NO_CATEGORY, excellent: "<5" },
    });
  });

  it("sends no count at all, of the bars or of a dorm, while 1 to 4 residents are tested", () => {
    const physical = dormPhysicalOf([
      {
        key: "dana_rakca",
        tally: tally(9, 4, { excellent: 4, good: 0, attention: 0, medical: 0 }),
      },
    ]);

    expect(physical).toEqual({
      recap: { kind: "too_few", students: 9 },
      byDorm: null,
    });
  });

  it("says nobody is tested, with no dorm's counts, when no resident in reach is", () => {
    const physical = dormPhysicalOf([
      { key: "wismantara_putri", tally: tally(3, 0, NO_CATEGORY) },
    ]);

    expect(physical).toEqual({
      recap: { kind: "untested", students: 3 },
      byDorm: null,
    });
  });

  it("counts nobody when the account reaches no resident", () => {
    expect(dormPhysicalOf([])).toEqual({
      recap: { kind: "untested", students: 0 },
      byDorm: null,
    });
  });
});
