import { skpmPartOf } from "./character-grade";
import type {
  AttendancePart,
  GradeInput,
  GradeStudent,
  SikuPart,
} from "./grade-list";

/**
 * Each part of the grades of some students, by the key of the student,
 * as the area each part belongs to reads and works it out.
 */
export interface GradeParts {
  /** A student with nothing counted yet may have no entry. */
  attendance: ReadonlyMap<string, AttendancePart>;
  /** The scores the Pengasuh gave this semester; none for a student without. */
  mentoring: ReadonlyMap<string, number>;
  /** Every student has an entry: SIKU is never missing. */
  siku: ReadonlyMap<string, SikuPart>;
  skpm: {
    /** How many SKPM uploads count now. */
    uploadsInForce: number;
    /** Nilai SKPM; none for a student with no row in force. */
    scores: ReadonlyMap<string, number>;
  };
}

const NOTHING_COUNTED: AttendancePart = {
  percent: null,
  attended: 0,
  counted: 0,
};

function sikuOf(parts: GradeParts, studentId: string): SikuPart {
  const siku = parts.siku.get(studentId);
  if (!siku) throw new Error("A student of the list has no SIKU.");
  return siku;
}

/** The students, each with the four parts of their grade. */
export function gradeInputsOf(
  students: readonly GradeStudent[],
  parts: GradeParts,
): GradeInput[] {
  return students.map((student) => ({
    student,
    attendance: parts.attendance.get(student.id) ?? NOTHING_COUNTED,
    mentoring: parts.mentoring.get(student.id) ?? null,
    siku: sikuOf(parts, student.id),
    skpm: skpmPartOf(
      parts.skpm.scores.get(student.id),
      parts.skpm.uploadsInForce,
    ),
  }));
}
