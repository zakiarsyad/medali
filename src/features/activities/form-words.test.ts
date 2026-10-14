import { describe, expect, it } from "vitest";
import type { ShownChoice } from "./chosen-participants";
import {
  activityTargetWords,
  chosenCountWords,
  formTargetWords,
  REMOVAL_QUESTION,
  REMOVED_WORDS,
  savedWords,
  semesterGroupWords,
} from "./form-words";

describe("the words of a removal", () => {
  it("ask first, and say that attendance already sent no longer counts", () => {
    expect(REMOVAL_QUESTION).toBe(
      "Hapus jadwal kegiatan ini? Presensi yang sudah masuk tidak lagi dihitung.",
    );
  });

  it("say so once the schedule is removed", () => {
    expect(REMOVED_WORDS).toBe("Jadwal dihapus.");
  });
});

const UPLOAD_NOTE =
  "Mahasiswa mengunggah foto kehadiran sejak kegiatan dimulai sampai batas rentang unggah; satu foto tervalidasi dihitung hadir.";

function ppks(name: string, semester: number) {
  return { name, target: { kind: "semester", semester } } as const;
}

function extra(name: string, choice: ShownChoice) {
  return { name, target: { kind: "chosen", choice } } as const;
}

describe("savedWords", () => {
  it("names the activity, its semester and its tahap", () => {
    expect(savedWords(ppks("Latihan dasar kepemimpinan organisasi", 3))).toBe(
      'Jadwal "Latihan dasar kepemimpinan organisasi" disimpan untuk semester 3 (penumbuhan).',
    );
    expect(savedWords(ppks("Seminar integritas dan antikorupsi", 7))).toBe(
      'Jadwal "Seminar integritas dan antikorupsi" disimpan untuk semester 7 (pematangan).',
    );
  });

  it.each<[ShownChoice, string]>([
    [{ kind: "students", chosen: 3 }, "3 mahasiswa terpilih"],
    [{ kind: "classes", classNames: ["2-01", "2-02"] }, "kelas 2-01, 2-02"],
    [{ kind: "cohorts", cohortYears: [2024] }, "angkatan 2024"],
    [
      { kind: "cohorts", cohortYears: [2023, 2024] },
      "lintas angkatan 2023, 2024",
    ],
  ])("names the activity and whom it is for: %j", (choice, sasaran) => {
    expect(savedWords(extra("Mentoring sebaya", choice))).toBe(
      `Jadwal "Mentoring sebaya" disimpan untuk ${sasaran}.`,
    );
  });
});

describe("chosenCountWords", () => {
  it("says how many Aktif students the choice holds", () => {
    expect(chosenCountWords(0)).toBe("Sasaran: 0 mahasiswa.");
    expect(chosenCountWords(1250)).toBe("Sasaran: 1.250 mahasiswa.");
  });
});

describe("formTargetWords", () => {
  it("says how many students the schedule is for, and the target", () => {
    expect(formTargetWords(96, 110)).toBe(
      `Sasaran: 96 mahasiswa (target 110). ${UPLOAD_NOTE}`,
    );
  });

  it("leaves the target out while none is known", () => {
    expect(formTargetWords(0, null)).toBe(
      `Sasaran: 0 mahasiswa. ${UPLOAD_NOTE}`,
    );
  });

  it("writes thousands the Indonesian way", () => {
    expect(formTargetWords(1250, 1300)).toContain(
      "Sasaran: 1.250 mahasiswa (target 1.300).",
    );
  });
});

describe("activityTargetWords", () => {
  it("names the target, or nothing for an activity without one", () => {
    expect(activityTargetWords(110)).toBe("target 110 peserta");
    expect(activityTargetWords(0)).toBe("target 0 peserta");
    expect(activityTargetWords(null)).toBe("");
  });
});

describe("semesterGroupWords", () => {
  it("names the semester and its tahap", () => {
    expect(semesterGroupWords(4)).toBe("Semester 4 (Penumbuhan)");
  });
});
