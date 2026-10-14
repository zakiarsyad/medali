import { describe, expect, it } from "vitest";
import {
  decidedByWords,
  fileAddressOf,
  hasDetails,
  heldWords,
  resultWords,
} from "./clarification-card";
import { TEST_CLARIFICATION } from "./test-clarifications";

describe("resultWords", () => {
  it.each([
    ["valid", "Diterima sebagai hadir"],
    ["dispensation", "Diterima sebagai dispensasi"],
    ["rejected", "Ditolak"],
  ] as const)("says how it was decided: %s", (result, words) => {
    expect(resultWords(result, "")).toBe(words);
  });

  it("adds the note of the decision when one was written", () => {
    expect(resultWords("rejected", "Lampiran tidak terbaca.")).toBe(
      "Ditolak: Lampiran tidak terbaca.",
    );
    expect(resultWords("valid", "Sudah dicek.")).toBe(
      "Diterima sebagai hadir: Sudah dicek.",
    );
  });
});

describe("decidedByWords", () => {
  it("names who decided and when, in campus time", () => {
    const at = new Date("2026-10-14T02:05:00Z");

    expect(decidedByWords("Penilai Uji", at)).toBe(
      "(Penilai Uji, 14 Okt 2026, 09.05)",
    );
  });
});

describe("heldWords", () => {
  const hours = { startTime: "07:30", endTime: "11:30" };

  it("says the day and the hours of a schedule of one day", () => {
    const schedule = { startsOn: "2026-10-10", endsOn: "2026-10-10", ...hours };

    expect(heldWords(schedule)).toBe("10 Okt 2026, 07:30–11:30");
  });

  it("says the first and the last day of a schedule of several", () => {
    const schedule = { startsOn: "2026-10-10", endsOn: "2026-10-12", ...hours };

    expect(heldWords(schedule)).toBe("10 Okt – 12 Okt 2026, 07:30–11:30");
  });
});

describe("fileAddressOf", () => {
  it("asks for the file to be shown in the page, or to be downloaded", () => {
    expect(fileAddressOf("abc", true)).toBe(
      "/kegiatan/klarifikasi/lampiran/abc?lihat=1",
    );
    expect(fileAddressOf("abc", false)).toBe(
      "/kegiatan/klarifikasi/lampiran/abc",
    );
  });
});

describe("hasDetails", () => {
  it("is yes for a card with its explanation and no for one without", () => {
    const { explanation: _, file: __, ...summary } = TEST_CLARIFICATION;

    expect(hasDetails(TEST_CLARIFICATION)).toBe(true);
    expect(hasDetails(summary)).toBe(false);
  });
});
