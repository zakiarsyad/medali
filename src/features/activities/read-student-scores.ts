import type { SQL } from "drizzle-orm";
import { runningPeriodOn } from "@/academic-periods/running-period";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import type { Database } from "@/db/connect";
import type { AttendanceScore } from "./attendance-score";
import { groupScore } from "./mean-score";
import { readCounted, readGroups } from "./read-mean-score";

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
  const scores = new Map<string, AttendanceScore>();
  const running = runningPeriodOn(await readAcademicPeriods(db), today);
  if (running === null) return scores;
  const schedules = await readCounted(db, running.id);
  const groups = await readGroups(db, visible, schedules, running.id);
  for (const group of groups) {
    const score = groupScore(group, schedules, running, today);
    for (const id of group.studentIds) scores.set(id, score);
  }
  return scores;
}
