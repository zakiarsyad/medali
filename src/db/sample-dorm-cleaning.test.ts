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
    const first = duties.filter((duty) => duty.repeatOf === null);
    const days = [...new Set(first.map((duty) => duty.day))];

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

  it("validates the duties of the past days but the first of yesterday, which waits, and leaves today and later Terjadwal", () => {
    const first = duties.filter((duty) => duty.repeatOf === null);
    const past = first.filter((duty) => duty.day < TODAY);
    const waiting = past.filter((duty) => duty.status === "judged");

    expect(waiting).toEqual([
      expect.objectContaining({ day: "2026-10-13", place: "Lapangan Apel" }),
    ]);
    expect(past.filter((duty) => duty.status === "validated")).toHaveLength(11);
    for (const duty of first.filter((each) => each.day >= TODAY)) {
      expect(duty).toMatchObject({ status: "scheduled", result: null });
    }
  });

  it("judges every fifth duty in turn Tidak memenuhi", () => {
    const notMet = duties.filter((duty) => duty.result === "not_met");
    expect(notMet.map((duty) => [duty.day, duty.place])).toEqual([
      ["2026-10-11", "Ruang Mesin Cuci"],
      ["2026-10-12", "Kamar Mandi"],
    ]);
  });

  it("repeats each validated Tidak memenuhi with the same room on the next day its place is free", () => {
    const repeats = duties.filter((duty) => duty.repeatOf !== null);

    expect(repeats).toHaveLength(2);
    for (const repeat of repeats) {
      const failed = duties[repeat.repeatOf ?? -1];
      expect(failed?.result).toBe("not_met");
      expect(repeat).toMatchObject({
        place: failed?.place,
        roomNumber: failed?.roomNumber,
        day: "2026-10-18",
        status: "scheduled",
        result: null,
      });
    }
  });

  it("gives no duty without rooms", () => {
    expect(sampleCleaningDuties(TODAY, [])).toEqual([]);
  });
});
