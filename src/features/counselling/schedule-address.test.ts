import { describe, expect, it } from "vitest";
import {
  FILTER_ORDER,
  FILTER_WORDS,
  HISTORY_PAGE_SIZE,
  moreHistoryAddress,
  readHistoryShown,
  readScheduleListParams,
  scheduleListAddress,
  statusesOf,
} from "./schedule-address";
import { SCHEDULE_KINDS } from "./schedule-ids";

describe("readScheduleListParams", () => {
  it("starts at Perlu ditindaklanjuti on the first page", () => {
    expect(readScheduleListParams({})).toEqual({
      filter: "needs_action",
      page: 1,
      kind: null,
    });
  });

  it("reads the status and the page", () => {
    expect(readScheduleListParams({ status: "semua", hal: "3" })).toEqual({
      filter: "all",
      page: 3,
      kind: null,
    });
  });

  it("reads the Jenis", () => {
    expect(readScheduleListParams({ jenis: "penugasan" })).toMatchObject({
      kind: "assigned",
    });
    expect(readScheduleListParams({ jenis: "pemanggilan" })).toMatchObject({
      kind: "called",
    });
    expect(readScheduleListParams({ jenis: "sukarela" })).toMatchObject({
      kind: "voluntary",
    });
  });

  it("takes what it does not understand as not chosen", () => {
    expect(
      readScheduleListParams({ status: "rahasia", hal: "-1", jenis: "x" }),
    ).toEqual({
      filter: "needs_action",
      page: 1,
      kind: null,
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
      expect(readScheduleListParams(params)).toEqual({
        filter,
        page: 2,
        kind: null,
      });
    }
  });

  it("keeps the Jenis with every choice and page", () => {
    for (const kind of SCHEDULE_KINDS) {
      const address = scheduleListAddress("all", 2, kind);
      const params = Object.fromEntries(
        new URL(address, "http://uji").searchParams,
      );
      expect(readScheduleListParams(params)).toEqual({
        filter: "all",
        page: 2,
        kind,
      });
    }
    expect(scheduleListAddress("needs_action", 1, "called")).toBe(
      "/konseling?jenis=pemanggilan",
    );
  });
});

describe("the Status filter", () => {
  it("offers Perlu ditindaklanjuti first, then Semua yang aktif, Dijadwalkan, Selesai, Tidak hadir, Dibatalkan and Semua", () => {
    expect(FILTER_ORDER.map((filter) => FILTER_WORDS[filter])).toEqual([
      "Perlu ditindaklanjuti",
      "Semua yang aktif",
      "Dijadwalkan",
      "Selesai",
      "Tidak hadir",
      "Dibatalkan",
      "Semua",
    ]);
  });

  it("narrows Perlu ditindaklanjuti to Diajukan, Menunggu jadwal and Minta jadwal ulang, each status choice to itself, and Semua yang aktif to the active statuses", () => {
    expect(statusesOf("needs_action")).toEqual([
      "submitted",
      "awaiting",
      "reschedule_asked",
    ]);
    expect(statusesOf("scheduled")).toEqual(["scheduled"]);
    expect(statusesOf("done")).toEqual(["done"]);
    expect(statusesOf("missed")).toEqual(["missed"]);
    expect(statusesOf("cancelled")).toEqual(["cancelled"]);
    expect(statusesOf("active")).toEqual([
      "submitted",
      "proposed",
      "scheduled",
      "awaiting",
      "reschedule_asked",
    ]);
    expect(statusesOf("all")).toBeNull();
  });
});

describe("Riwayat in the address", () => {
  it("shows the first 10 when the address asks nothing, or something it does not understand", () => {
    expect(readHistoryShown({})).toBe(HISTORY_PAGE_SIZE);
    expect(readHistoryShown({ riwayat: "0" })).toBe(HISTORY_PAGE_SIZE);
    expect(readHistoryShown({ riwayat: "x" })).toBe(HISTORY_PAGE_SIZE);
  });

  it("shows 10 more for each step asked, and names the next step", () => {
    expect(HISTORY_PAGE_SIZE).toBe(10);
    expect(readHistoryShown({ riwayat: "3" })).toBe(30);
    expect(moreHistoryAddress(10)).toBe("/konseling?riwayat=2");
    expect(moreHistoryAddress(20)).toBe("/konseling?riwayat=3");
  });
});
