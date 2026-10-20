import { describe, expect, it } from "vitest";
import {
  DESCRIPTION_MAX_LENGTH,
  DESCRIPTION_MIN_LENGTH,
  OTHER_PUNISHMENT_MAX_LENGTH,
  REMARK_MAX_LENGTH,
} from "@/features/guidance/violation-note-ids";
import { SAMPLE_STUDENTS } from "./sample-data";
import { SAMPLE_VIOLATION_NOTES } from "./sample-violation-notes";

const PROGRAM_OF = new Map(
  SAMPLE_STUDENTS.map((student) => [student.nim, student.studyProgram]),
);

describe("the sample violation notes", () => {
  it.each(SAMPLE_VIOLATION_NOTES)(
    "are of a sample student, with texts within their lengths: $nim, $description",
    (note) => {
      expect(PROGRAM_OF.has(note.nim)).toBe(true);
      expect(note.description.length).toBeGreaterThanOrEqual(
        DESCRIPTION_MIN_LENGTH,
      );
      expect(note.description.length).toBeLessThanOrEqual(
        DESCRIPTION_MAX_LENGTH,
      );
      expect(note.remark.length).toBeLessThanOrEqual(REMARK_MAX_LENGTH);
      expect(note.otherPunishment.length).toBeLessThanOrEqual(
        OTHER_PUNISHMENT_MAX_LENGTH,
      );
      expect(note.punishment === "other").toBe(note.otherPunishment !== "");
    },
  );

  it("are in this semester and a past one, with a student who has two this semester", () => {
    const now = SAMPLE_VIOLATION_NOTES.filter((note) => note.semester === 0);
    const past = SAMPLE_VIOLATION_NOTES.filter((note) => note.semester === 1);
    expect(now.length).toBeGreaterThan(2);
    expect(past.length).toBeGreaterThan(0);
    const nims = now.map((note) => note.nim);
    expect(nims.some((nim, place) => nims.indexOf(nim) !== place)).toBe(true);
  });

  it("hold notes of D3 Pajak, the program of the sample Ketua Program Studi, and of other programs", () => {
    const programs = SAMPLE_VIOLATION_NOTES.map((note) =>
      PROGRAM_OF.get(note.nim),
    );
    expect(programs).toContain("D3 Pajak");
    expect(programs.some((program) => program !== "D3 Pajak")).toBe(true);
  });

  it("are saved by Pembina Disiplin Mahasiswa and Kepala Unit, who write the notes", () => {
    const writers = new Set(SAMPLE_VIOLATION_NOTES.map((note) => note.savedAs));
    expect([...writers].sort()).toEqual(["discipline_officer", "head_of_unit"]);
  });
});
