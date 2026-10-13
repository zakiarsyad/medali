import { describe, expect, it } from "vitest";
import {
  parseEvaluation,
  type SentEvaluation,
  scoreOf,
} from "./evaluation-input";

const GROUP_ID = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f4a01";
const PERIOD_ID = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f4a02";

const SENT: SentEvaluation = {
  groupId: GROUP_ID,
  periodId: PERIOD_ID,
  activity: "80",
  attendance: "75",
  achievement: "70",
  feedback: "85",
  note: "  Rutin mendampingi.  ",
};

function errorOf(sent: SentEvaluation): string | null {
  const parsed = parseEvaluation(sent);
  return parsed.ok ? null : parsed.error;
}

describe("scoreOf", () => {
  it("reads a whole number from 0 to 100", () => {
    expect(scoreOf("0")).toBe(0);
    expect(scoreOf(" 87 ")).toBe(87);
    expect(scoreOf("100")).toBe(100);
  });

  it.each(["", " ", "101", "-1", "79.5", "79,5", "1e2", "abc", "1000"])(
    "reads no value from %j",
    (sent) => {
      expect(scoreOf(sent)).toBeNull();
    },
  );
});

describe("parseEvaluation", () => {
  it("gives the group, the period, the four values and the note without its outer blanks", () => {
    expect(parseEvaluation(SENT)).toEqual({
      ok: true,
      value: {
        groupId: GROUP_ID,
        periodId: PERIOD_ID,
        scores: { activity: 80, attendance: 75, achievement: 70, feedback: 85 },
        note: "Rutin mendampingi.",
      },
    });
  });

  it("keeps no note when it is empty", () => {
    const parsed = parseEvaluation({ ...SENT, note: "   " });

    expect(parsed).toMatchObject({ ok: true, value: { note: null } });
  });

  it.each([
    ["activity", "Keaktifan pendampingan"],
    ["attendance", "Kehadiran pada kegiatan kelompok"],
    ["achievement", "Capaian karakter kelompok"],
    ["feedback", "Umpan balik mahasiswa"],
  ] as const)("names %s when its value is empty", (aspect, title) => {
    expect(errorOf({ ...SENT, [aspect]: "" })).toBe(
      `Isi nilai ${title} dengan angka 0 sampai 100.`,
    );
  });

  it.each([
    ["activity", "Keaktifan pendampingan"],
    ["attendance", "Kehadiran pada kegiatan kelompok"],
    ["achievement", "Capaian karakter kelompok"],
    ["feedback", "Umpan balik mahasiswa"],
  ] as const)(
    "names %s when its value is outside 0 to 100",
    (aspect, title) => {
      const wrong = `Nilai ${title} harus bilangan bulat dari 0 sampai 100.`;

      expect(errorOf({ ...SENT, [aspect]: "101" })).toBe(wrong);
      expect(errorOf({ ...SENT, [aspect]: "-1" })).toBe(wrong);
      expect(errorOf({ ...SENT, [aspect]: "79.5" })).toBe(wrong);
    },
  );

  it("names the first aspect that is wrong", () => {
    expect(errorOf({ ...SENT, attendance: "", feedback: "200" })).toContain(
      "Kehadiran pada kegiatan kelompok",
    );
  });

  it("asks for a group and for a period when what names them is no id", () => {
    expect(errorOf({ ...SENT, groupId: "" })).toBe(
      "Pilih kelompok pengasuhan.",
    );
    expect(errorOf({ ...SENT, groupId: "1 or 1=1" })).toBe(
      "Pilih kelompok pengasuhan.",
    );
    expect(errorOf({ ...SENT, periodId: "ganjil" })).toBe("Pilih periode.");
  });

  it("refuses a note longer than 1.000 characters", () => {
    expect(errorOf({ ...SENT, note: "a".repeat(1001) })).toBe(
      "Catatan evaluasi paling panjang 1.000 karakter.",
    );
    expect(errorOf({ ...SENT, note: "a".repeat(1000) })).toBeNull();
  });
});
