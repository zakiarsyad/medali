import { describe, expect, it } from "vitest";
import {
  choicesWith,
  type FormPeriod,
  keptChoice,
  participantsOn,
  startingValues,
  valuesOf,
} from "./form-values";
import {
  TEST_CHOICES,
  TEST_EXTRA_SCHEDULE,
  TEST_SCHEDULE,
} from "./test-screen-parts";

describe("valuesOf", () => {
  it("fills the form with what the schedule holds, Wajib as the schedule has it", () => {
    expect(valuesOf(TEST_SCHEDULE)).toEqual({
      activityId: TEST_SCHEDULE.activity.id,
      startsOn: "2026-10-13",
      endsOn: "2026-10-14",
      startTime: "07:30",
      endTime: "11:30",
      uploadCount: 1,
      uploadUnit: "week",
      location: "Aula asrama",
      isRequired: false,
    });
  });
});

describe("keptChoice", () => {
  it("gives the PPKS activity a schedule holds with the semester of its target", () => {
    expect(keptChoice(TEST_SCHEDULE)).toEqual({
      ...TEST_SCHEDULE.activity,
      semester: 3,
    });
  });

  it("gives none for a schedule of an extra activity", () => {
    expect(keptChoice(TEST_EXTRA_SCHEDULE)).toBeNull();
  });
});

describe("choicesWith", () => {
  it("offers only the activities in the list for a new schedule", () => {
    expect(choicesWith(TEST_CHOICES, null)).toEqual(TEST_CHOICES);
  });

  it("adds the activity a schedule holds when it is no longer in the list", () => {
    const held = keptChoice(TEST_SCHEDULE);
    if (!held) throw new Error("The schedule holds no PPKS activity.");
    const offered = choicesWith(TEST_CHOICES, held);

    expect(offered).toEqual([...TEST_CHOICES, held]);
  });

  it("does not offer an activity twice when the one held is still in the list", () => {
    const [held] = TEST_CHOICES;
    if (!held) throw new Error("There are no choices.");

    expect(choicesWith(TEST_CHOICES, held)).toEqual(TEST_CHOICES);
  });
});

const PERIODS: FormPeriod[] = [
  { startYear: 2026, term: "odd", startsOn: "2026-08-01" },
  { startYear: 2025, term: "even", startsOn: "2026-02-01" },
];

const PARTS = {
  periods: PERIODS,
  counts: [
    { cohortYear: 2026, students: 120 },
    { cohortYear: 2025, students: 96 },
  ],
};

describe("startingValues", () => {
  it("starts a new schedule today, from 07:30 to 11:30, with 1 hari to upload, required, with nothing chosen", () => {
    expect(startingValues("2026-10-13")).toEqual({
      activityId: "",
      startsOn: "2026-10-13",
      endsOn: "2026-10-13",
      startTime: "07:30",
      endTime: "11:30",
      uploadCount: 1,
      uploadUnit: "day",
      location: "",
      isRequired: true,
    });
  });
});

describe("participantsOn", () => {
  it("counts the students in the semester of the activity on the first day", () => {
    expect(participantsOn(PARTS, { semester: 1 }, "2026-10-13")).toBe(120);
    expect(participantsOn(PARTS, { semester: 3 }, "2026-10-13")).toBe(96);
  });

  it("follows the first day into another period", () => {
    // In Genap 2025/2026 the angkatan 2025 is in semester 2, and the
    // angkatan 2026 is not there yet.
    expect(participantsOn(PARTS, { semester: 2 }, "2026-04-01")).toBe(96);
    expect(participantsOn(PARTS, { semester: 1 }, "2026-04-01")).toBe(0);
    expect(participantsOn(PARTS, { semester: 2 }, "2026-10-13")).toBe(0);
  });

  it("counts nobody while no activity is chosen", () => {
    expect(participantsOn(PARTS, null, "2026-10-13")).toBe(0);
  });

  it("counts nobody for a first day that is empty or before the first period", () => {
    expect(participantsOn(PARTS, { semester: 1 }, "")).toBe(0);
    expect(participantsOn(PARTS, { semester: 1 }, "2026-01-31")).toBe(0);
  });
});
