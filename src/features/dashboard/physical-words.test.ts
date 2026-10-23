import { describe, expect, it } from "vitest";
import type { PhysicalRecap } from "@/health-notes/fitness-recap";
import {
  illnessLine,
  PHYSICAL_TOO_FEW,
  physicalCardLine,
  physicalCardValue,
  stackParts,
  testedLine,
  untestedLine,
} from "./physical-words";

const SHOWN: Extract<PhysicalRecap, { kind: "shown" }> = {
  kind: "shown",
  students: 1200,
  tested: 1000,
  untested: 200,
  byCategory: { excellent: 400, good: 300, attention: 200, medical: "<5" },
  fitShare: 78,
  illnesses: null,
};

describe("the card Kesehatan jasmani", () => {
  it("shows the share of prima and baik, how many are tested and how many need a doctor", () => {
    expect(physicalCardValue(SHOWN)).toBe("78%");
    expect(physicalCardLine(SHOWN)).toBe(
      "1.000 dari 1.200 sudah dites. <5 perlu tindak lanjut medis.",
    );
  });

  it("shows - while the share is held back, and while no number may be shown", () => {
    expect(physicalCardValue({ ...SHOWN, fitShare: null })).toBe("-");
    expect(physicalCardValue({ kind: "too_few", students: 40 })).toBe("-");
    expect(physicalCardLine({ kind: "too_few", students: 40 })).toBe(
      PHYSICAL_TOO_FEW,
    );
  });

  it("says so when nobody is tested yet", () => {
    const none: PhysicalRecap = { kind: "untested", students: 1200 };

    expect(physicalCardValue(none)).toBe("-");
    expect(physicalCardLine(none)).toBe(
      "Belum ada hasil tes kebugaran dari 1.200 mahasiswa.",
    );
  });
});

describe("the words of Kategori tes kebugaran", () => {
  it("says how many are tested, and how many are not, <5 for 1 to 4", () => {
    expect(testedLine(SHOWN)).toBe("1.000 dari 1.200 sudah dites");
    expect(untestedLine(200)).toBe(
      "200 mahasiswa belum mengikuti tes kebugaran.",
    );
    expect(untestedLine("<5")).toBe(
      "<5 mahasiswa belum mengikuti tes kebugaran.",
    );
    expect(untestedLine(0)).toBe(
      "Semua mahasiswa sudah mengikuti tes kebugaran.",
    );
  });

  it("names the most common illnesses with their counts", () => {
    expect(
      illnessLine([
        { illness: "asthma", students: 12 },
        { illness: "bone_joint_injury", students: "<5" },
      ]),
    ).toBe(
      "Riwayat penyakit terbanyak pada kategori perlu perhatian dan perlu tindak lanjut medis: Asma (12), Cedera atau operasi tulang/sendi (<5).",
    );
  });
});

describe("stackParts", () => {
  it("lays the categories shown along the whole group, leaving out <5 and 0", () => {
    expect(
      stackParts({ excellent: 50, good: 0, attention: "<5", medical: 25 }, 100),
    ).toEqual([
      { category: "excellent", start: 0, length: 50 },
      { category: "medical", start: 50, length: 25 },
    ]);
  });

  it("leaves out a category hidden as 5+", () => {
    expect(
      stackParts(
        { excellent: 50, good: "5+", attention: "<5", medical: 25 },
        100,
      ),
    ).toEqual([
      { category: "excellent", start: 0, length: 50 },
      { category: "medical", start: 50, length: 25 },
    ]);
  });
});
