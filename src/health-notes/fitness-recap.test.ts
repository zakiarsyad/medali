import { describe, expect, it } from "vitest";
import { type FitnessTally, physicalRecapOf } from "./fitness-recap";

/** The fewest a count needs when none is held back, as for one's own anak asuh. */
const NONE_HELD_BACK = 1;

const TALLY: FitnessTally = {
  students: 40,
  tested: 30,
  byCategory: { excellent: 10, good: 8, attention: 6, medical: 6 },
};

const ILLS = [{ illness: "asthma", students: 9 }] as const;

describe("physicalRecapOf", () => {
  it("gives the most common illnesses of the two lower categories, most first, each of 1 to 4 as <5 after those shown", () => {
    const recap = physicalRecapOf(TALLY, [
      { illness: "asthma", students: 2 },
      { illness: "hypertension", students: 7 },
      { illness: "diabetes", students: 4 },
      { illness: "allergy", students: 12 },
      { illness: "epilepsy", students: 1 },
      { illness: "heart_disease", students: 7 },
    ]);

    expect(recap).toMatchObject({
      illnesses: [
        { illness: "allergy", students: 12 },
        { illness: "hypertension", students: 7 },
        { illness: "heart_disease", students: 7 },
        { illness: "diabetes", students: "<5" },
      ],
    });
  });

  it("puts the illnesses shown as <5 in the order of Riwayat penyakit, so their order tells nothing", () => {
    const recap = physicalRecapOf(TALLY, [
      { illness: "epilepsy", students: 4 },
      { illness: "asthma", students: 1 },
    ]);

    expect(recap).toMatchObject({
      illnesses: [
        { illness: "asthma", students: "<5" },
        { illness: "epilepsy", students: "<5" },
      ],
    });
  });

  it("leaves out Lainnya and an illness nobody has", () => {
    const recap = physicalRecapOf(TALLY, [
      { illness: "other", students: 20 },
      { illness: "asthma", students: 0 },
    ]);

    expect(recap).toMatchObject({ illnesses: [] });
  });

  it("gives the counts of each final category, those not tested and the share of prima and baik", () => {
    expect(physicalRecapOf(TALLY, null)).toEqual({
      kind: "shown",
      students: 40,
      tested: 30,
      untested: 10,
      byCategory: { excellent: 10, good: 8, attention: 6, medical: 6 },
      fitShare: 60,
      illnesses: null,
    });
  });

  it("tells a group with no test apart, with only how many students it holds", () => {
    const none = { excellent: 0, good: 0, attention: 0, medical: 0 };

    expect(
      physicalRecapOf({ students: 7, tested: 0, byCategory: none }, []),
    ).toEqual({ kind: "untested", students: 7 });
  });

  it("gives no count at all while fewer than 5 are tested, also with a note that sets a category", () => {
    for (const tested of [1, 4]) {
      expect(
        physicalRecapOf(
          {
            students: 40,
            tested,
            byCategory: { excellent: 0, good: 0, attention: 1, medical: 6 },
          },
          ILLS,
        ),
      ).toEqual({ kind: "too_few", students: 40 });
    }
  });

  it("gives every count as it is for Dashboard anak asuh, which holds none back", () => {
    const recap = physicalRecapOf(
      {
        students: 6,
        tested: 3,
        byCategory: { excellent: 1, good: 1, attention: 0, medical: 1 },
      },
      null,
      NONE_HELD_BACK,
    );

    expect(recap).toMatchObject({
      kind: "shown",
      untested: 3,
      byCategory: { excellent: 1, good: 1, attention: 0, medical: 1 },
      fitShare: 67,
    });
  });

  it("gives each illness count as it is, most first, for Dashboard anak asuh", () => {
    const recap = physicalRecapOf(
      {
        students: 3,
        tested: 2,
        byCategory: { excellent: 0, good: 0, attention: 1, medical: 1 },
      },
      [
        { illness: "asthma", students: 1 },
        { illness: "hypertension", students: 2 },
      ],
      NONE_HELD_BACK,
    );

    expect(recap).toMatchObject({
      illnesses: [
        { illness: "hypertension", students: 2 },
        { illness: "asthma", students: 1 },
      ],
    });
  });

  it("sends a count of 1 to 4 only as <5, also those not tested", () => {
    const recap = physicalRecapOf(
      {
        students: 33,
        tested: 30,
        byCategory: { excellent: 20, good: 0, attention: 4, medical: 6 },
      },
      null,
    );

    expect(recap).toMatchObject({
      untested: "<5",
      byCategory: { excellent: 20, good: 0, attention: "<5", medical: "5+" },
      fitShare: 67,
    });
  });

  it("hides Prima too while the <5 and the 5+ add up to the fewest they could, 1 and 5", () => {
    const recap = physicalRecapOf(
      {
        students: 26,
        tested: 26,
        byCategory: { excellent: 20, good: 0, attention: 1, medical: 5 },
      },
      null,
    );

    expect(recap).toMatchObject({
      byCategory: { excellent: "5+", good: 0, attention: "<5", medical: "5+" },
      fitShare: null,
    });
  });

  it("sends the smallest other category above 0 as 5+ while only one is <5, with no number of either", () => {
    const recap = physicalRecapOf(
      {
        students: 40,
        tested: 30,
        byCategory: { excellent: 12, good: 7, attention: 3, medical: 7 },
      },
      null,
    );

    expect(recap).toEqual({
      kind: "shown",
      students: 40,
      tested: 30,
      untested: 10,
      byCategory: { excellent: 12, good: "5+", attention: "<5", medical: 7 },
      fitShare: null,
      illnesses: null,
    });
  });

  it("leaves out the share while Prima is hidden as 5+", () => {
    const recap = physicalRecapOf(
      {
        students: 30,
        tested: 30,
        byCategory: { excellent: 6, good: 10, attention: 3, medical: 11 },
      },
      null,
    );

    expect(recap).toMatchObject({
      byCategory: { excellent: "5+", good: 10, attention: "<5", medical: 11 },
      fitShare: null,
    });
  });

  it("hides no second category for Dashboard anak asuh, which holds none back", () => {
    const recap = physicalRecapOf(
      {
        students: 20,
        tested: 20,
        byCategory: { excellent: 12, good: 6, attention: 2, medical: 0 },
      },
      null,
      NONE_HELD_BACK,
    );

    expect(recap).toMatchObject({
      byCategory: { excellent: 12, good: 6, attention: 2, medical: 0 },
      fitShare: 90,
    });
  });

  it("leaves out the share while prima and baik hold 1 to 4 together, as it would give the number back", () => {
    const recap = physicalRecapOf(
      {
        students: 30,
        tested: 30,
        byCategory: { excellent: 1, good: 3, attention: 20, medical: 6 },
      },
      null,
    );

    expect(recap).toMatchObject({
      byCategory: { excellent: "<5", good: "<5" },
      fitShare: null,
    });
  });

  it("takes the share of the students with a category, a student with only a note among them", () => {
    const recap = physicalRecapOf(
      {
        students: 12,
        tested: 5,
        byCategory: { excellent: 5, good: 0, attention: 0, medical: 5 },
      },
      null,
    );

    expect(recap).toMatchObject({ tested: 5, untested: 7, fitShare: 50 });
  });
});
