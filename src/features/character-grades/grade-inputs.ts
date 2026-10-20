import type { SQL } from "drizzle-orm";
import { runningPeriodOn } from "@/academic-periods/running-period";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import type { Database } from "@/db/connect";
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
import { skpmPartOf } from "./character-grade";
import type { AttendancePart, GradeInput } from "./grade-list";
import { readGradeStudents } from "./grade-students";

/*
 * The character grade is made of parts that each belong to their own
 * area, so this is the one file where it reads from them: each part is
 * read and worked out there by its own rule, and only put together here.
 */

const NOTHING_COUNTED: AttendanceScore = { attended: 0, counted: 0 };

const NO_ENTRY: SikuTotals = { gains: 0, losses: 0 };

/** The students of "Daftar nilai karakter" and what Nilai dasar SIKU is. */
export interface GradeInputs {
  inputs: GradeInput[];
  sikuBase: number;
}

function attendancePartOf(score: AttendanceScore): AttendancePart {
  return { ...score, percent: scorePercent(score) };
}

function sikuPartOf(base: number, totals: SikuTotals): GradeInput["siku"] {
  return {
    score: sikuOf(base, totals),
    adjusted: totals.gains > 0 || totals.losses > 0,
    note: sikuNote(base, totals),
  };
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
 * Every Aktif student `visible` lets through, by name, with the four parts
 * of their grade as they stand now, in the period that runs on `today`.
 * Each part is read once for all of them, never student by student.
 */
export async function readGradeInputs(
  db: Database,
  visible: SQL,
  today: string,
): Promise<GradeInputs> {
  const [people, periods, base, conversion] = await Promise.all([
    readGradeStudents(db, visible),
    readAcademicPeriods(db),
    readBaseScore(db),
    readConversion(db),
  ]);
  const running = runningPeriodOn(periods, today);
  const ids = people.map((student) => student.id);
  const [attendance, mentoring, siku, skpm] = await Promise.all([
    readStudentScores(db, visible, today),
    readMentoringScores(db, ids, running?.id ?? null),
    readTotalsOf(db, ids),
    readSkpmScores(db, ids, conversion.pointsForHundred),
  ]);
  const inputs = people.map((student) => ({
    student,
    attendance: attendancePartOf(attendance.get(student.id) ?? NOTHING_COUNTED),
    mentoring: mentoring.get(student.id) ?? null,
    siku: sikuPartOf(base.score, siku.get(student.id) ?? NO_ENTRY),
    skpm: skpmPartOf(skpm.scores.get(student.id), skpm.uploads),
  }));
  return { inputs, sikuBase: base.score };
}
