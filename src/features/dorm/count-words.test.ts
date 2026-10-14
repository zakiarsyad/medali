import { describe, expect, it } from "vitest";
import { absentWords, announceQuestion, countStatusWords } from "./count-words";

// 19:45 on campus on 12 October 2026.
const EVENING = new Date("2026-10-12T12:45:00Z");

describe("countStatusWords", () => {
  it("says Belum diumumkan for an activity not counted yet", () => {
    expect(countStatusWords(null)).toBe("Belum diumumkan.");
  });

  it("says Belum diumumkan with the time of the last draft", () => {
    expect(
      countStatusWords({
        savedAt: EVENING,
        announcedAt: null,
        announcedBy: null,
      }),
    ).toBe("Belum diumumkan. Draf terakhir disimpan 12 Okt 2026, 19.45.");
  });

  it("says who announced it and when, and how a correction goes out", () => {
    expect(
      countStatusWords({
        savedAt: EVENING,
        announcedAt: EVENING,
        announcedBy: "Rizky Pratama",
      }),
    ).toBe(
      "Ketidakhadiran sudah diumumkan 12 Okt 2026, 19.45 oleh Rizky Pratama. Perbaikan dikirim dengan Umumkan ulang.",
    );
  });
});

describe("absentWords", () => {
  it("counts the absent among the participants", () => {
    expect(absentWords(3, 1200)).toBe(
      "3 dari 1.200 peserta ditandai tidak hadir.",
    );
  });
});

describe("announceQuestion", () => {
  it("asks before the first announcement and before Umumkan ulang", () => {
    expect(announceQuestion(2, "Apel pagi", false)).toBe(
      "Umumkan 2 mahasiswa tidak hadir pada Apel pagi?",
    );
    expect(announceQuestion(0, "Apel pagi", true)).toBe(
      "Umumkan ulang: 0 mahasiswa tidak hadir pada Apel pagi?",
    );
  });
});
