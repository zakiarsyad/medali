import { and, type SQL, sql } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { readDormCohorts } from "@/dorms/dorm-cohorts";
import { dormInSql } from "@/dorms/resident-condition";
import type { FitnessLimits } from "@/health-notes/fitness-ids";
import {
  type HealthPick,
  type HealthSubject,
  readNoteSubject,
  searchNoteStudents,
} from "@/health-notes/note-subject";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";

/**
 * Whether roles write health notes on Penilaian jasmani: they enter
 * fitness scores and read health notes, as Kepala Unit and Penilai
 * Mahasiswa do.
 */
export function mayWriteNotes(roles: readonly RoleId[]): boolean {
  return may(roles, "enter_fitness_scores") && may(roles, "view_health_notes");
}

/**
 * The students an account may write a note for on Penilaian jasmani:
 * Aktif ones its roles with the right "Penilaian jasmani" see, who live
 * in no dorm. The angkatan years given are those in a semester that
 * lives in the dorm. Dorm residents' notes are written on Asrama.
 */
export function writableFor(
  actor: AccountForAccess,
  dormCohorts: number[],
): SQL | undefined {
  return and(
    ACTIVE_MEMBER,
    visibleTo(rowLimitForAction(actor, "enter_fitness_scores")),
    sql`${dormInSql(dormCohorts)} is null`,
  );
}

/** The angkatan years in the dorm on a day, none while no period runs. */
export async function dormCohortsOn(
  db: Database,
  day: string,
): Promise<number[]> {
  return (await readDormCohorts(db, day)) ?? [];
}

/**
 * The students the account may write a note for whose name or NIM holds
 * the text, 10 at most, by name. An empty or too long text finds nobody,
 * and so does what is no text at all: `query` comes from outside.
 */
export async function searchHealthStudents(
  db: Database,
  actor: AccountForAccess,
  query: unknown,
  day: string,
): Promise<HealthPick[]> {
  const writable = writableFor(actor, await dormCohortsOn(db, day));
  return searchNoteStudents(db, writable, query);
}

/**
 * The test category and every note of a student the account may write a
 * note for and read the notes of, or null for any other student.
 */
export async function readHealthSubject(
  db: Database,
  actor: AccountForAccess,
  studentId: string,
  limits: FitnessLimits,
  day: string,
): Promise<HealthSubject | null> {
  if (!may(actor.roles, "view_health_notes")) return null;
  const readable = visibleTo(rowLimitForAction(actor, "view_health_notes"));
  const writable = writableFor(actor, await dormCohortsOn(db, day));
  return readNoteSubject(db, and(writable, readable), studentId, limits);
}
