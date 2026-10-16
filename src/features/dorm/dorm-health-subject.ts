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
 * Whether roles write health notes on Asrama > Kesehatan: they write
 * residents' notes and read the list, as Kepala Unit and BAM - Kesehatan
 * do.
 */
export function mayWriteDormNotes(roles: readonly RoleId[]): boolean {
  return (
    may(roles, "write_dorm_health_notes") &&
    may(roles, "view_dorm_health_notes")
  );
}

/**
 * The students an account may write a note for on Asrama > Kesehatan on
 * a day: the Aktif residents its roles with the right to write see.
 * Nobody for an account without that right. Notes of students who live
 * in no dorm are written on Penilaian jasmani.
 */
export async function dormWritableFor(
  db: Database,
  actor: AccountForAccess,
  day: string,
): Promise<SQL | undefined> {
  if (!may(actor.roles, "write_dorm_health_notes")) return sql`false`;
  const cohorts = (await readDormCohorts(db, day)) ?? [];
  return and(
    ACTIVE_MEMBER,
    visibleTo(rowLimitForAction(actor, "write_dorm_health_notes")),
    sql`${dormInSql(cohorts)} is not null`,
  );
}

/**
 * The residents the account may write a note for whose name or NIM holds
 * the text, 10 at most, by name. An empty or too long text finds nobody,
 * and so does what is no text at all: `query` comes from outside.
 */
export async function searchDormHealthStudents(
  db: Database,
  actor: AccountForAccess,
  query: unknown,
  day: string,
): Promise<HealthPick[]> {
  const writable = await dormWritableFor(db, actor, day);
  return searchNoteStudents(db, writable, query);
}

/**
 * The test category and every note of a resident the account may write
 * a note for and see in the list, or null for any other student.
 */
export async function readDormHealthSubject(
  db: Database,
  actor: AccountForAccess,
  studentId: string,
  limits: FitnessLimits,
  day: string,
): Promise<HealthSubject | null> {
  if (!mayWriteDormNotes(actor.roles)) return null;
  const readable = visibleTo(
    rowLimitForAction(actor, "view_dorm_health_notes"),
  );
  const writable = await dormWritableFor(db, actor, day);
  return readNoteSubject(db, and(writable, readable), studentId, limits);
}
