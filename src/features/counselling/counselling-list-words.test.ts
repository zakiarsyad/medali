import { describe, expect, it } from "vitest";
import {
  comingDay,
  scheduleWords,
  sessionsWords,
} from "./counselling-list-words";

describe("Konseling of a row of Daftar mahasiswa", () => {
  it("is - while no session was written down", () => {
    expect(sessionsWords(0, null)).toBe("-");
  });

  it("says how many sessions there were", () => {
    expect(sessionsWords(3, null)).toBe("3 sesi");
  });

  it("adds the next session when one is set", () => {
    expect(sessionsWords(2, "2026-10-26")).toBe(
      "2 sesi, berikutnya 26 Okt 2026",
    );
  });
});

describe("the next session of a row", () => {
  it("is the latest session's Sesi berikutnya from today on", () => {
    expect(comingDay("2026-10-21", "2026-10-21")).toBe("2026-10-21");
    expect(comingDay("2026-10-28", "2026-10-21")).toBe("2026-10-28");
  });

  it("is none once it has passed, or when none is set", () => {
    expect(comingDay("2026-10-20", "2026-10-21")).toBeNull();
    expect(comingDay(null, "2026-10-21")).toBeNull();
  });
});

describe("Jadwal of a row of Daftar mahasiswa", () => {
  it("is - without an active schedule", () => {
    expect(scheduleWords(null)).toBe("-");
  });

  it("gives the status and the time", () => {
    expect(
      scheduleWords({ status: "scheduled", day: "2026-10-26", hour: "10:00" }),
    ).toBe("Dijadwalkan, 26 Okt 2026 pukul 10:00");
  });

  it("gives the status alone while an assignment has no time yet", () => {
    expect(scheduleWords({ status: "awaiting", day: null, hour: null })).toBe(
      "Menunggu jadwal",
    );
  });
});
