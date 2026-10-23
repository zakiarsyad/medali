import { describe, expect, it } from "vitest";
import {
  leaveListAddress,
  ownLeaveAddress,
  ownLeavePageOf,
  readLeaveListParams,
} from "./leave-address";

describe("readLeaveListParams", () => {
  it("starts at Menunggu verifikasi, every kind, the first page", () => {
    expect(readLeaveListParams({})).toEqual({
      filters: { query: "", status: "submitted", kind: "all" },
      page: 1,
    });
  });

  it("reads the search, the status, the kind and the page", () => {
    expect(
      readLeaveListParams({
        cari: " Anisa ",
        status: "ditolak",
        jenis: "itmk",
        hal: "3",
      }),
    ).toEqual({
      filters: { query: "Anisa", status: "rejected", kind: "skip_activities" },
      page: 3,
    });
  });

  it("reads the choices of the return from leave, and writes them back the same", () => {
    const named = {
      "laporan-kembali": "reports",
      "di-luar": "out",
      terlambat: "late",
    };
    for (const [address, status] of Object.entries(named)) {
      const params = readLeaveListParams({ status: address });

      expect(params.filters.status).toBe(status);
      expect(leaveListAddress(params.filters)).toBe(
        `/asrama/izin?status=${address}`,
      );
    }
  });

  it("takes what it does not understand as not chosen", () => {
    expect(
      readLeaveListParams({
        cari: "a".repeat(101),
        status: "kedaluwarsa",
        jenis: "cuti",
        hal: "-1",
      }),
    ).toEqual({
      filters: { query: "", status: "submitted", kind: "all" },
      page: 1,
    });
  });
});

describe("leaveListAddress", () => {
  it("leaves out what is not chosen", () => {
    expect(
      leaveListAddress({ query: "", status: "submitted", kind: "all" }),
    ).toBe("/asrama/izin");
  });

  it("names every choice, and reads back as the same filters", () => {
    const filters = {
      query: "Anisa W",
      status: "all" as const,
      kind: "special" as const,
    };
    const address = leaveListAddress(filters, 2);

    expect(address).toBe(
      "/asrama/izin?cari=Anisa+W&status=semua&jenis=khusus&hal=2",
    );
    const params = Object.fromEntries(
      new URL(address, "http://x").searchParams,
    );
    expect(readLeaveListParams(params)).toEqual({ filters, page: 2 });
  });
});

describe("ownLeaveAddress", () => {
  it("leaves out the first page", () => {
    expect(ownLeaveAddress(1)).toBe("/asrama/izin");
    expect(ownLeaveAddress(2)).toBe("/asrama/izin?riwayat=2");
  });
});

describe("ownLeavePageOf", () => {
  it("reads the page of the own history apart from the page of the staff list", () => {
    const params = Object.fromEntries(
      new URL(ownLeaveAddress(3), "http://x").searchParams,
    );

    expect(ownLeavePageOf({ ...params, hal: "2" })).toBe(3);
    expect(readLeaveListParams({ ...params, hal: "2" }).page).toBe(2);
    expect(readLeaveListParams(params).page).toBe(1);
  });

  it("takes the first page for anything it does not understand", () => {
    expect(ownLeavePageOf({})).toBe(1);
    expect(ownLeavePageOf({ riwayat: "-1" })).toBe(1);
    expect(ownLeavePageOf({ hal: "2" })).toBe(1);
  });
});
