import { describe, expect, it } from "vitest";
import {
  FILTER_ORDER,
  FILTER_WORDS,
  readScheduleListParams,
  scheduleListAddress,
  statusesOf,
} from "./schedule-address";

describe("readScheduleListParams", () => {
  it("starts at Perlu ditindaklanjuti on the first page", () => {
    expect(readScheduleListParams({})).toEqual({
      filter: "needs_action",
      page: 1,
    });
  });

  it("reads the status and the page", () => {
    expect(readScheduleListParams({ status: "semua", hal: "3" })).toEqual({
      filter: "all",
      page: 3,
    });
  });

  it("takes what it does not understand as not chosen", () => {
    expect(readScheduleListParams({ status: "rahasia", hal: "-1" })).toEqual({
      filter: "needs_action",
      page: 1,
    });
  });
});

describe("scheduleListAddress", () => {
  it("leaves out Perlu ditindaklanjuti and the first page", () => {
    expect(scheduleListAddress("needs_action")).toBe("/konseling");
  });

  it("names every choice in a way the address reads back", () => {
    for (const filter of FILTER_ORDER) {
      const address = scheduleListAddress(filter, 2);
      const params = Object.fromEntries(
        new URL(address, "http://uji").searchParams,
      );
      expect(readScheduleListParams(params)).toEqual({ filter, page: 2 });
    }
  });
});

describe("the Status filter", () => {
  it("offers Perlu ditindaklanjuti first, then Semua yang aktif, Dijadwalkan and Semua", () => {
    expect(FILTER_ORDER.map((filter) => FILTER_WORDS[filter])).toEqual([
      "Perlu ditindaklanjuti",
      "Semua yang aktif",
      "Dijadwalkan",
      "Semua",
    ]);
  });

  it("narrows Perlu ditindaklanjuti to Diajukan, Dijadwalkan to itself, and the others to the active statuses", () => {
    expect(statusesOf("needs_action")).toEqual(["submitted"]);
    expect(statusesOf("scheduled")).toEqual(["scheduled"]);
    expect(statusesOf("active")).toEqual([
      "submitted",
      "proposed",
      "scheduled",
    ]);
    expect(statusesOf("all")).toBeNull();
  });
});
