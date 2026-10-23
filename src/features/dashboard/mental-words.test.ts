import { describe, expect, it } from "vitest";
import type { PublishedRow } from "@/mental-health/mental-recap";
import {
  assessedLine,
  mentalCardLine,
  mentalCardValue,
  publishedLine,
} from "./mental-words";

describe("the card Kesehatan mental", () => {
  it("shows how many are assessed, <5 for 1 to 4, and 0 for none", () => {
    const byLevel = {
      normal: 1000,
      mild: 200,
      moderate: 0,
      severe: 0,
      extremely_severe: 0,
    };
    expect(mentalCardValue({ kind: "shown", assessed: 1200, byLevel })).toBe(
      "1.200",
    );
    expect(mentalCardValue({ kind: "too_few" })).toBe("<5");
    expect(mentalCardValue({ kind: "none" })).toBe("0");
  });

  it("says how many are published to the account, with those needing counselling only when there are", () => {
    expect(mentalCardLine({ rows: [], matching: 3, needCounselling: 1 })).toBe(
      "3 data dipublikasikan konselor untuk Anda, 1 perlu konseling.",
    );
    expect(mentalCardLine({ rows: [], matching: 2, needCounselling: 0 })).toBe(
      "2 data dipublikasikan konselor untuk Anda.",
    );
    expect(mentalCardLine(null)).toBe(
      "0 data dipublikasikan konselor untuk Anda.",
    );
  });
});

describe("Kesehatan mental mahasiswa", () => {
  it("says how many are assessed, and that no name shows unless published", () => {
    expect(assessedLine(1200)).toBe(
      "1.200 mahasiswa sudah diasesmen. Identitas tidak ditampilkan kecuali dipublikasikan konselor.",
    );
  });
});

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
