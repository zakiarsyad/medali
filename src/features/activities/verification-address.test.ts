import { describe, expect, it } from "vitest";
import {
  readVerificationParams,
  verificationAddress,
} from "./verification-address";

const SCHEDULE_ID = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";

describe("readVerificationParams", () => {
  it("starts at Menunggu verifikasi, every activity and the first page", () => {
    expect(readVerificationParams({})).toEqual({
      filters: { scheduleId: null, status: "waiting" },
      page: 1,
    });
  });

  it.each([
    ["menunggu", "waiting"],
    ["divalidasi", "valid"],
    ["ditolak", "rejected"],
    ["semua", "all"],
  ] as const)("reads the status %s", (sent, status) => {
    expect(readVerificationParams({ status: sent }).filters.status).toBe(
      status,
    );
  });

  it("reads the activity and the page", () => {
    const read = readVerificationParams({ kegiatan: SCHEDULE_ID, hal: "3" });

    expect(read.filters.scheduleId).toBe(SCHEDULE_ID);
    expect(read.page).toBe(3);
  });

  it("takes what it does not understand as not chosen", () => {
    const read = readVerificationParams({
      kegiatan: "bukan-kunci",
      status: "valid'; drop",
      hal: "-2",
    });

    expect(read).toEqual({
      filters: { scheduleId: null, status: "waiting" },
      page: 1,
    });
  });
});

describe("verificationAddress", () => {
  it("leaves out what is not chosen, Menunggu verifikasi and the first page", () => {
    expect(verificationAddress({ scheduleId: null, status: "waiting" })).toBe(
      "/kegiatan/verifikasi",
    );
  });

  it("names the activity, the status and the page, and is read back the same", () => {
    const filters = { scheduleId: SCHEDULE_ID, status: "rejected" } as const;

    const address = verificationAddress(filters, 2);

    expect(address).toBe(
      `/kegiatan/verifikasi?kegiatan=${SCHEDULE_ID}&status=ditolak&hal=2`,
    );
    const sent = Object.fromEntries(new URL(address, "http://x").searchParams);
    expect(readVerificationParams(sent)).toEqual({ filters, page: 2 });
  });
});
