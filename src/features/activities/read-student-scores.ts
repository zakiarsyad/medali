import type { SQL } from "drizzle-orm";
import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { runningPeriodOn } from "@/academic-periods/running-period";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import type { Database } from "@/db/connect";
import type { AttendanceScore } from "./attendance-score";
import { groupScore } from "./mean-score";
import { readCounted, readStudentStandings } from "./read-mean-score";

/**
 * Nilai kehadiran kegiatan of each Aktif student `visible` lets through,
 * over the period that runs on `today`, by the same rule as Rerata nilai
 * kehadiran: activities and mentor meetings together. A student with
 * nothing counted has 0 of 0. With no running period nobody has a score.
 */
export async function readStudentScores(
  db: Database,
  visible: SQL,
  today: string,
): Promise<Map<string, AttendanceScore>> {
  const running = runningPeriodOn(await readAcademicPeriods(db), today);
  if (running === null) return new Map();
  return readStudentScoresIn(db, visible, running, today);
}

/**
 * Nilai kehadiran kegiatan of each Aktif student `visible` lets through,
 * over one period as it stands on `today`, which may be after its end.
 */
export async function readStudentScoresIn(
  db: Database,
  visible: SQL,
  period: AcademicPeriod,
  today: string,
): Promise<Map<string, AttendanceScore>> {
  const scores = new Map<string, AttendanceScore>();
  const schedules = await readCounted(db, period.id);
  const standings = await readStudentStandings(
    db,
    visible,
    schedules,
    period.id,
  );
  for (const standing of standings) {
    const score = groupScore(standing, schedules, period, today);
    scores.set(standing.studentId, score);
  }
  return scores;
}
