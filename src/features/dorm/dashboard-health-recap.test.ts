// Sample NIMs of this file: 9911000100 to 9911000199. None is added to
// the database.
import { describe, expect, it } from "vitest";
import { DORM_IDS } from "@/dorms/dorms";
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
  nim: "9911000101",
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
  it("adds the dorms up for the bars and gives a dorm with 5 or more tested its own counts, each of 1 to 4 as <5", () => {
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
        tally: tally(10, 9, { ...NO_CATEGORY, excellent: 9 }),
      },
    ]);

    expect(physical.recap).toMatchObject({
      kind: "shown",
      students: 20,
      tested: 18,
      byCategory: { excellent: 14, good: "<5", attention: "<5", medical: "<5" },
      illnesses: null,
    });
    expect(physical.byDorm).toEqual({
      wismantara_putra: NO_CATEGORY,
      wismantara_putri: NO_CATEGORY,
      dana_rakca: { excellent: 5, good: "<5", attention: "<5", medical: "<5" },
      cipta_bakti: { ...NO_CATEGORY, excellent: 9 },
    });
  });

  it("holds back the other dorm too when only one dorm is held back, so the bars give neither back", () => {
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

    expect(physical.byDorm).toEqual({
      wismantara_putra: NO_CATEGORY,
      wismantara_putri: NO_CATEGORY,
      dana_rakca: null,
      cipta_bakti: null,
    });
  });

  it("holds back the smallest other dorm with a category, the first in dorm order on a tie", () => {
    const physical = dormPhysicalOf([
      {
        key: "wismantara_putra",
        tally: tally(12, 12, { ...NO_CATEGORY, excellent: 12 }),
      },
      {
        key: "wismantara_putri",
        tally: tally(8, 8, { ...NO_CATEGORY, excellent: 8 }),
      },
      {
        key: "dana_rakca",
        tally: tally(3, 3, { ...NO_CATEGORY, excellent: 3 }),
      },
      {
        key: "cipta_bakti",
        tally: tally(8, 8, { ...NO_CATEGORY, excellent: 8 }),
      },
    ]);

    expect(physical.byDorm).toEqual({
      wismantara_putra: { ...NO_CATEGORY, excellent: 12 },
      wismantara_putri: null,
      dana_rakca: null,
      cipta_bakti: { ...NO_CATEGORY, excellent: 8 },
    });
  });

  it("hides a dorm's 5 of Perlu tindak lanjut medis as 5+ beside another dorm's <5 under a bar of 7, and each row and column with one hidden count hides one more", () => {
    const physical = dormPhysicalOf([
      {
        key: "wismantara_putra",
        tally: tally(25, 25, { ...NO_CATEGORY, excellent: 20, medical: 5 }),
      },
      {
        key: "wismantara_putri",
        tally: tally(29, 29, {
          excellent: 20,
          good: 3,
          attention: 4,
          medical: 2,
        }),
      },
    ]);

    expect(physical.recap).toMatchObject({
      byCategory: { excellent: 40, good: "<5", attention: "<5", medical: 7 },
    });
    expect(physical.byDorm).toEqual({
      wismantara_putra: {
        excellent: "5+",
        good: 0,
        attention: 0,
        medical: "5+",
      },
      wismantara_putri: {
        excellent: "5+",
        good: "<5",
        attention: "<5",
        medical: "<5",
      },
      dana_rakca: NO_CATEGORY,
      cipta_bakti: NO_CATEGORY,
    });
    expect(JSON.stringify(physical.byDorm)).not.toMatch(/":[1-9]/);
  });

  it("takes a column as a set only while its bar shows a number", () => {
    const physical = dormPhysicalOf([
      {
        key: "wismantara_putra",
        tally: tally(20, 20, { ...NO_CATEGORY, excellent: 15, good: 5 }),
      },
      {
        key: "wismantara_putri",
        tally: tally(19, 19, {
          ...NO_CATEGORY,
          excellent: 15,
          good: 1,
          attention: 3,
        }),
      },
    ]);

    expect(physical.recap).toMatchObject({
      byCategory: { excellent: 30, good: "5+", attention: "<5", medical: 0 },
    });
    expect(physical.byDorm).toEqual({
      wismantara_putra: { ...NO_CATEGORY, excellent: 15, good: 5 },
      wismantara_putri: {
        excellent: 15,
        good: "<5",
        attention: "<5",
        medical: 0,
      },
      dana_rakca: NO_CATEGORY,
      cipta_bakti: NO_CATEGORY,
    });
  });

  it("hides one more count of a dorm's row while its two <5 add up to the fewest they could", () => {
    const physical = dormPhysicalOf([
      {
        key: "wismantara_putra",
        tally: tally(12, 12, {
          ...NO_CATEGORY,
          excellent: 10,
          good: 1,
          attention: 1,
        }),
      },
      {
        key: "wismantara_putri",
        tally: tally(22, 22, {
          ...NO_CATEGORY,
          excellent: 10,
          good: 6,
          attention: 6,
        }),
      },
    ]);

    expect(physical.recap).toMatchObject({
      byCategory: { excellent: 20, good: 7, attention: 7, medical: 0 },
    });
    expect(physical.byDorm).toEqual({
      wismantara_putra: {
        excellent: "5+",
        good: "<5",
        attention: "<5",
        medical: 0,
      },
      wismantara_putri: {
        excellent: "5+",
        good: "5+",
        attention: "5+",
        medical: 0,
      },
      dana_rakca: NO_CATEGORY,
      cipta_bakti: NO_CATEGORY,
    });
  });

  it("hides a dorm's count in a column whose bar is hidden while none of its counts is, so the column does not give the bar back", () => {
    const physical = dormPhysicalOf([
      {
        key: "wismantara_putra",
        tally: tally(21, 21, { ...NO_CATEGORY, excellent: 15, good: 6 }),
      },
      {
        key: "wismantara_putri",
        tally: tally(24, 24, {
          excellent: 15,
          good: 0,
          attention: 3,
          medical: 6,
        }),
      },
    ]);

    expect(physical.recap).toMatchObject({
      tested: 45,
      byCategory: { excellent: 30, good: "5+", attention: "<5", medical: 6 },
    });
    expect(physical.byDorm).toEqual({
      wismantara_putra: {
        excellent: "5+",
        good: "5+",
        attention: 0,
        medical: 0,
      },
      wismantara_putri: {
        excellent: "5+",
        good: 0,
        attention: "<5",
        medical: "5+",
      },
      dana_rakca: NO_CATEGORY,
      cipta_bakti: NO_CATEGORY,
    });
  });

  it("holds back more dorms while a column whose bar is <5 adds up to 4 at its fewest", () => {
    const counts = { ...NO_CATEGORY, excellent: 10, attention: 1 };
    const physical = dormPhysicalOf(
      DORM_IDS.map((key) => ({ key, tally: tally(11, 11, counts) })),
    );

    expect(physical.recap).toMatchObject({
      tested: 44,
      byCategory: { excellent: "5+", good: 0, attention: "<5", medical: 0 },
    });
    const shown = { excellent: "5+", good: 0, attention: "<5", medical: 0 };
    expect(physical.byDorm).toEqual({
      wismantara_putra: null,
      wismantara_putri: null,
      dana_rakca: shown,
      cipta_bakti: shown,
    });
  });

  it("gives every dorm's counts as they are while none is 1 to 4", () => {
    const counts = { excellent: 10, good: 6, attention: 5, medical: 0 };
    const physical = dormPhysicalOf([
      { key: "dana_rakca", tally: tally(21, 21, counts) },
      { key: "cipta_bakti", tally: tally(21, 21, counts) },
    ]);

    expect(physical.byDorm).toEqual({
      wismantara_putra: NO_CATEGORY,
      wismantara_putri: NO_CATEGORY,
      dana_rakca: counts,
      cipta_bakti: counts,
    });
  });

  it("sends no category count of a dorm where only 1 to 4 residents in reach are tested", () => {
    const physical = dormPhysicalOf([
      {
        key: "dana_rakca",
        tally: tally(8, 8, { ...NO_CATEGORY, excellent: 8 }),
      },
      {
        key: "cipta_bakti",
        tally: tally(3, 1, { ...NO_CATEGORY, medical: 1 }),
      },
    ]);

    expect(physical.recap.kind).toBe("shown");
    expect(physical.byDorm?.cipta_bakti).toBeNull();
    expect(physical.byDorm?.dana_rakca).toBeNull();
    expect(JSON.stringify(physical.byDorm)).not.toContain("<5");
  });

  it("sends no category count of a dorm with nobody tested where a note puts 1 to 4 residents in a category", () => {
    const physical = dormPhysicalOf([
      {
        key: "dana_rakca",
        tally: tally(8, 8, { ...NO_CATEGORY, excellent: 8 }),
      },
      {
        key: "cipta_bakti",
        tally: tally(3, 0, { ...NO_CATEGORY, medical: 1 }),
      },
      { key: "wismantara_putra", tally: tally(2, 0, NO_CATEGORY) },
    ]);

    expect(physical.byDorm?.cipta_bakti).toBeNull();
    expect(physical.byDorm?.wismantara_putra).toEqual(NO_CATEGORY);
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
