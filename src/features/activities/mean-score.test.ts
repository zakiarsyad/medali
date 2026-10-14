import { describe, expect, it } from "vitest";
import {
  type CountedSchedule,
  meanScore,
  type StudentGroup,
} from "./mean-score";

const PERIOD = { startYear: 2026, term: "odd" } as const;
const TODAY = "2026-10-20";

/** A required schedule of one day for semester 3, closed a day after it. */
function schedule(
  id: string,
  endsOn: string,
  more: Partial<CountedSchedule> = {},
): CountedSchedule {
  return {
    id,
    semester: 3,
    isRequired: true,
    endsOn,
    uploadCount: 1,
    uploadUnit: "day",
    ...more,
  };
}

/** Students of angkatan 2025, who are in semester 3 during Ganjil 2026. */
function group(
  students: number,
  kept: StudentGroup["kept"] = {},
  cohortYear = 2025,
  chosenIn: string[] = [],
): StudentGroup {
  return { cohortYear, kept, chosenIn, students };
}

const CLOSED = [schedule("a", "2026-10-01"), schedule("b", "2026-10-05")];

describe("meanScore", () => {
  it("is the mean of the students' scores, each group counted as many times as it has students", () => {
    const groups = [
      group(3, { a: "valid", b: "valid" }),
      group(1, { a: "valid" }),
      group(1),
    ];

    // Three at 100, one at 50, one at 0.
    expect(meanScore(groups, CLOSED, PERIOD, TODAY)).toEqual({
      percent: 70,
      students: 5,
    });
  });

  it("rounds the mean to one decimal", () => {
    const groups = [group(2, { a: "valid", b: "valid" }), group(1)];

    expect(meanScore(groups, CLOSED, PERIOD, TODAY).percent).toBe(66.7);
  });

  it("leaves a dispensation out of the student's score, as on the student's own page", () => {
    const groups = [group(1, { a: "dispensation", b: "valid" })];

    expect(meanScore(groups, CLOSED, PERIOD, TODAY)).toEqual({
      percent: 100,
      students: 1,
    });
  });

  it("leaves out a student with nothing counted: only dispensations, or no schedule closed yet", () => {
    const open = [schedule("c", "2026-10-20")];

    expect(
      meanScore(
        [group(4, { a: "dispensation", b: "dispensation" })],
        CLOSED,
        PERIOD,
        TODAY,
      ),
    ).toEqual({ percent: null, students: 0 });
    expect(meanScore([group(4)], open, PERIOD, TODAY)).toEqual({
      percent: null,
      students: 0,
    });
  });

  it("counts a valid attendance at once, before the upload time has closed", () => {
    const open = [schedule("c", "2026-10-20")];

    expect(meanScore([group(2, { c: "valid" })], open, PERIOD, TODAY)).toEqual({
      percent: 100,
      students: 2,
    });
  });

  it("counts only the schedules meant for the angkatan of each group, and only the required ones", () => {
    const schedules = [
      ...CLOSED,
      schedule("other", "2026-10-02", { semester: 1 }),
      schedule("free", "2026-10-03", { isRequired: false }),
    ];
    const third = group(1, { a: "valid", b: "valid" });
    const first = group(1, { other: "valid" }, 2026);

    expect(meanScore([third, first], schedules, PERIOD, TODAY)).toEqual({
      percent: 100,
      students: 2,
    });
  });

  it("counts a required extra activity only for the students it names", () => {
    const schedules = [
      ...CLOSED,
      schedule("extra", "2026-10-04", { semester: null }),
    ];
    const chosen = group(1, { a: "valid", b: "valid" }, 2025, ["extra"]);
    const notChosen = group(1, { a: "valid", b: "valid" });

    // The one chosen missed the extra activity: 2 of 3.
    expect(meanScore([chosen, notChosen], schedules, PERIOD, TODAY)).toEqual({
      percent: 83.4,
      students: 2,
    });
  });

  it("leaves out an extra activity that is not required, also for those it names", () => {
    const schedules = [
      ...CLOSED,
      schedule("free", "2026-10-04", { semester: null, isRequired: false }),
    ];
    const chosen = group(1, { a: "valid", b: "valid" }, 2025, ["free"]);

    expect(meanScore([chosen], schedules, PERIOD, TODAY)).toEqual({
      percent: 100,
      students: 1,
    });
  });

  it("has no mean without students", () => {
    expect(meanScore([], CLOSED, PERIOD, TODAY)).toEqual({
      percent: null,
      students: 0,
    });
  });
});
