import { describe, expect, it } from "vitest";
import {
  ownViolationsAddress,
  readOwnViolationParams,
  readStaffViolationParams,
  staffViolationsAddress,
  VIOLATIONS_ADDRESS,
} from "./violation-address";

const KEY = "00000000-0000-4000-8000-000000000001";

describe("readStaffViolationParams", () => {
  it("starts with nothing chosen and every first page", () => {
    expect(readStaffViolationParams({})).toEqual({
      appealPage: 1,
      schedulePage: 1,
      day: null,
      announcementPage: 1,
      periodId: null,
      query: "",
      page: 1,
      studentId: null,
      studentPage: 1,
    });
  });

  it("reads what the address chose", () => {
    expect(
      readStaffViolationParams({
        advokasi: "6",
        jadwal: "2",
        tgl: "2026-10-12",
        umum: "3",
        sem: KEY,
        cari: " Ani ",
        hal: "4",
        mhs: KEY,
        mhshal: "5",
      }),
    ).toEqual({
      appealPage: 6,
      schedulePage: 2,
      day: "2026-10-12",
      announcementPage: 3,
      periodId: KEY,
      query: "Ani",
      page: 4,
      studentId: KEY,
      studentPage: 5,
    });
  });

  it("trusts nothing it does not understand", () => {
    expect(
      readStaffViolationParams({
        jadwal: "-1",
        tgl: "2026-02-30",
        sem: "ganjil",
        cari: "a".repeat(101),
        hal: "x",
        mhs: "'; drop",
      }),
    ).toEqual(readStaffViolationParams({}));
  });
});

describe("staffViolationsAddress", () => {
  it("leaves out what is not chosen", () => {
    expect(staffViolationsAddress(readStaffViolationParams({}))).toBe(
      VIOLATIONS_ADDRESS,
    );
  });

  it("is read back as the same choices", () => {
    const params = readStaffViolationParams({
      tgl: "2026-10-12",
      sem: KEY,
      cari: "Ani",
      hal: "2",
      mhs: KEY,
      advokasi: "3",
    });
    const address = staffViolationsAddress(params);
    const search = Object.fromEntries(
      new URL(address, "http://x").searchParams,
    );

    expect(readStaffViolationParams(search)).toEqual(params);
  });
});

describe("readOwnViolationParams and ownViolationsAddress", () => {
  it("reads Semua periode, a period, or the running one", () => {
    expect(readOwnViolationParams({ periode: "semua" }).periodId).toBe("all");
    expect(readOwnViolationParams({ periode: KEY }).periodId).toBe(KEY);
    expect(readOwnViolationParams({ periode: "x" }).periodId).toBeNull();
  });

  it("is read back as the same choices", () => {
    for (const periode of ["semua", KEY]) {
      const params = readOwnViolationParams({ periode, hal: "2", umum: "3" });
      const address = ownViolationsAddress(params);
      const search = Object.fromEntries(
        new URL(address, "http://x").searchParams,
      );
      expect(readOwnViolationParams(search)).toEqual(params);
    }
  });
});
