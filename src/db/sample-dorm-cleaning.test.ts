import { describe, expect, it } from "vitest";
import {
  SAMPLE_CLEANING_PLACES,
  sampleCleaningDuties,
} from "./sample-dorm-cleaning";

const TODAY = "2026-10-14";
const ROOMS = ["101", "102", "201"];

describe("sampleCleaningDuties", () => {
  const duties = sampleCleaningDuties(TODAY, ROOMS);

  it("gives every place one duty a day, from three days before to three days after", () => {
    const days = [...new Set(duties.map((duty) => duty.day))];

    expect(days).toEqual([
      "2026-10-11",
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
      "2026-10-17",
    ]);
    for (const day of days) {
      const places = duties.filter((duty) => duty.day === day);
      expect(places.map((duty) => duty.place)).toEqual([
        ...SAMPLE_CLEANING_PLACES,
      ]);
    }
  });

  it("takes the rooms in turn", () => {
    expect(duties.slice(0, 5).map((duty) => duty.roomNumber)).toEqual([
      "101",
      "102",
      "201",
      "101",
      "102",
    ]);
  });

  it("gives no duty without rooms", () => {
    expect(sampleCleaningDuties(TODAY, [])).toEqual([]);
  });
});
