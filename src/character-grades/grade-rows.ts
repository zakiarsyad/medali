import type { SQL } from "drizzle-orm";
import { runningPeriodOn } from "@/academic-periods/running-period";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import type { Database } from "@/db/connect";
import { readLimitsOf } from "@/discipline-penalties/read-limits";
import {
  type AttendanceScore,
  scorePercent,
} from "@/features/activities/attendance-score";
import { readStudentScores } from "@/features/activities/read-student-scores";
import { readBaseScore } from "@/features/curriculum/stored-base-score";
import { readPeriodScores } from "@/features/mentoring/period-scores";
import { type SikuTotals, sikuOf } from "@/features/siku/siku-score";
import { readTotalsOf } from "@/features/siku/siku-totals";
import { sikuNote } from "@/features/siku/siku-words";
import { readConversion } from "@/features/skpm/skpm-conversion";
import { readSkpmScores } from "@/features/skpm/skpm-scores";
import { type GradeParts, gradeInputsOf } from "./grade-inputs";
import {
  type AttendancePart,
  type GradeRow,
  gradeRowOf,
  type SikuPart,
} from "./grade-list";
import { readGradeStudents } from "./grade-students";
import type { GradeScheme } from "./scheme-ids";

function attendanceParts(
  scores: ReadonlyMap<string, AttendanceScore>,
): Map<string, AttendancePart> {
  const parts = new Map<string, AttendancePart>();
  for (const [id, score] of scores) {
    parts.set(id, { ...score, percent: scorePercent(score) });
  }
  return parts;
}

function sikuParts(
  base: number,
  totals: ReadonlyMap<string, SikuTotals>,
): Map<string, SikuPart> {
  const parts = new Map<string, SikuPart>();
  for (const [id, each] of totals) {
    parts.set(id, {
      score: sikuOf(base, each),
      adjusted: each.gains > 0 || each.losses > 0,
      note: sikuNote(base, each),
    });
  }
  return parts;
}

function readMentoringScores(
  db: Database,
  studentIds: readonly string[],
  periodId: string | null,
): Promise<Map<string, number>> {
  if (periodId === null) return Promise.resolve(new Map());
  return readPeriodScores(db, studentIds, periodId);
}

/**
 * Each part of the grades of some students, read once for all of them,
 * never student by student, each by the area it belongs to, in the
 * period that runs on `today`.
 */
async function readGradeParts(
  db: Database,
  visible: SQL,
  studentIds: readonly string[],
  today: string,
): Promise<{ parts: GradeParts; sikuBase: number }> {
  const [periods, base, conversion] = await Promise.all([
    readAcademicPeriods(db),
    readBaseScore(db),
    readConversion(db),
  ]);
  const running = runningPeriodOn(periods, today);
  const [attendance, mentoring, siku, skpm] = await Promise.all([
    readStudentScores(db, visible, today),
    readMentoringScores(db, studentIds, running?.id ?? null),
    readTotalsOf(db, studentIds),
    readSkpmScores(db, studentIds, conversion.pointsForHundred),
  ]);
  const parts = {
    attendance: attendanceParts(attendance),
    mentoring,
    siku: sikuParts(base.score, siku),
    skpm: { uploadsInForce: skpm.uploads, scores: skpm.scores },
  };
  return { parts, sikuBase: base.score };
}

/** The rows of "Daftar nilai karakter" and what Nilai dasar SIKU is. */
export interface GradeRows {
  rows: GradeRow[];
  sikuBase: number;
}

/**
 * Every Aktif student `visible` lets through, by name, with the semester
 * character grade the scheme gives the parts as they stand now, held at
 * 70 for a student under a Ringan or Sedang penalty.
 */
export async function readGradeRows(
  db: Database,
  visible: SQL,
  scheme: GradeScheme,
  today: string,
): Promise<GradeRows> {
  const students = await readGradeStudents(db, visible);
  const ids = students.map((student) => student.id);
  const [{ parts, sikuBase }, limits] = await Promise.all([
    readGradeParts(db, visible, ids, today),
    readLimitsOf(db, ids),
  ]);
  const rows = gradeInputsOf(students, parts).map((input) =>
    gradeRowOf(input, scheme, limits.has(input.student.id)),
  );
  return { rows, sikuBase };
}
