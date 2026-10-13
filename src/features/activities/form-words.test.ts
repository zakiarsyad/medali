import { describe, expect, it } from "vitest";
import {
  activityTargetWords,
  formTargetWords,
  savedWords,
  semesterGroupWords,
} from "./form-words";

const UPLOAD_NOTE =
  "Mahasiswa mengunggah foto kehadiran sejak kegiatan dimulai sampai batas rentang unggah; satu foto tervalidasi dihitung hadir.";

describe("savedWords", () => {
  it("names the activity, its semester and its tahap", () => {
    expect(savedWords("Latihan dasar kepemimpinan organisasi", 3)).toBe(
      'Jadwal "Latihan dasar kepemimpinan organisasi" disimpan untuk semester 3 (penumbuhan).',
    );
    expect(savedWords("Seminar integritas dan antikorupsi", 7)).toBe(
      'Jadwal "Seminar integritas dan antikorupsi" disimpan untuk semester 7 (pematangan).',
    );
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
