import { describe, expect, it } from "vitest";
import type { PublishedRow } from "./mental-recap";
import { publishedLine } from "./published-words";

const ROW: PublishedRow = {
  studentId: "00000000-0000-4000-8000-000000000001",
  publishedAt: new Date("2026-10-21T03:00:00Z"),
  name: "Mahasiswa Contoh",
  mentorName: "Pengasuh Contoh",
  data: ["level", "counselling", "summary"],
  level: "moderate",
  sessions: {
    count: 2,
    lastDay: "2026-10-19",
    followUp: "monitoring",
    nextDay: null,
  },
  summary: "Mahasiswa sedang dalam pendampingan rutin.",
};

describe("a row of Data kesehatan mental yang dipublikasikan", () => {
  it("names the Pengasuh, the sessions with Tindak lanjut, and the summary", () => {
    expect(publishedLine(ROW)).toBe(
      "Pengasuh: Pengasuh Contoh. 2 sesi konseling. Tindak lanjut: Pemantauan. Mahasiswa sedang dalam pendampingan rutin.",
    );
  });

  it("leaves out the Pengasuh for Dashboard anak asuh, whose reader they are", () => {
    expect(publishedLine(ROW, false)).toBe(
      "2 sesi konseling. Tindak lanjut: Pemantauan. Mahasiswa sedang dalam pendampingan rutin.",
    );
  });

  it("says only what is shared, and so when a shared part has nothing yet", () => {
    expect(
      publishedLine({
        ...ROW,
        mentorName: null,
        data: ["level", "counselling"],
        level: null,
        sessions: null,
        summary: null,
      }),
    ).toBe("Belum ada asesmen. Belum ada sesi konseling.");
    expect(
      publishedLine({ ...ROW, data: ["level"], sessions: null, summary: null }),
    ).toBe("Pengasuh: Pengasuh Contoh.");
  });
});
