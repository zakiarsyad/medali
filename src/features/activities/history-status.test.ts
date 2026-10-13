import { describe, expect, it } from "vitest";
import { HISTORY_WORDS, historyStatus } from "./history-status";

/** Held on 10 October; photos may be sent until the end of 12 October. */
const SCHEDULE = {
  endsOn: "2026-10-10",
  uploadCount: 2,
  uploadUnit: "day",
} as const;

describe("historyStatus", () => {
  it.each(["waiting", "valid", "rejected", "dispensation"] as const)(
    "is %s where the attendance stands so, open or closed",
    (status) => {
      expect(historyStatus(status, SCHEDULE, "2026-10-11")).toBe(status);
      expect(historyStatus(status, SCHEDULE, "2026-11-30")).toBe(status);
    },
  );

  it("is not sent yet, with nothing sent, up to the last upload day", () => {
    expect(historyStatus(null, SCHEDULE, "2026-10-11")).toBe("not_sent");
    expect(historyStatus(null, SCHEDULE, "2026-10-12")).toBe("not_sent");
  });

  it("is absent, with nothing sent, from the day after the last upload day", () => {
    expect(historyStatus(null, SCHEDULE, "2026-10-13")).toBe("absent");
  });

  it("is said in the words of the screen", () => {
    expect(HISTORY_WORDS).toEqual({
      waiting: "Menunggu verifikasi",
      valid: "Hadir",
      rejected: "Ditolak",
      dispensation: "Dispensasi",
      absent: "Tidak hadir",
      not_sent: "Belum unggah",
    });
  });
});
