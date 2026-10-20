import { and, desc, eq, inArray, type SQL, sql } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import {
  accounts,
  mentalHealthMarkChanges,
  mentalHealthMarks,
  students,
} from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { MarkCategory, MentalHealthMark } from "./mental-health-mark-ids";
import { type MarkInput, NO_MARK } from "./mental-health-mark-input";

/**
 * Whether roles set marks "Potensi kesehatan mental" in the form: they
 * set marks and read them, as Kepala Unit and BAM - Kesehatan do.
 */
export function maySetMarks(roles: readonly RoleId[]): boolean {
  return (
    may(roles, "write_mental_health_marks") &&
    may(roles, "view_mental_health_marks")
  );
}

/** A student's stored mark, or no mark for one never marked. */
export async function readStoredMark(
  tx: Database,
  studentId: string,
): Promise<MarkInput> {
  const [stored] = await tx
    .select({
      category: mentalHealthMarks.category,
      observation: mentalHealthMarks.observation,
    })
    .from(mentalHealthMarks)
    .where(eq(mentalHealthMarks.studentId, studentId));
  return stored ?? NO_MARK;
}

/** Whether the form with this key had its change of a mark kept already. */
export async function isMarkLogged(
  tx: Database,
  key: string,
): Promise<boolean> {
  const [line] = await tx
    .select({ id: mentalHealthMarkChanges.id })
    .from(mentalHealthMarkChanges)
    .where(eq(mentalHealthMarkChanges.id, key));
  return line !== undefined;
}

/** A change of a student's mark, as the form with `key` sent it. */
export interface MarkChange {
  key: string;
  studentId: string;
  before: MarkInput;
  after: MarkInput;
}

/**
 * Keeps a student's one current mark, in place of the one before, and
 * writes the change in the log under the form's key, with who made it
 * and when. The caller checks the right to write, that the mark does
 * change, and holds the saves of health notes, so the mark before is
 * still the one stored.
 */
export async function keepMark(
  tx: Database,
  by: string,
  change: MarkChange,
): Promise<void> {
  const { key, studentId, before, after } = change;
  const kept = { ...after, changedBy: by, changedAt: WRITTEN_NOW };
  await tx
    .insert(mentalHealthMarks)
    .values({ studentId, ...kept })
    .onConflictDoUpdate({ target: mentalHealthMarks.studentId, set: kept });
  await tx.insert(mentalHealthMarkChanges).values({
    id: key,
    studentId,
    categoryBefore: before.category,
    observationBefore: before.observation,
    categoryAfter: after.category,
    observationAfter: after.observation,
    changedBy: by,
    changedAt: WRITTEN_NOW,
  });
}

/**
 * The current mark of a student the account may read marks of, or null
 * for no mark, for any other student, and for an account without the
 * right to read marks.
 */
export async function readMarkOf(
  db: Database,
  actor: AccountForAccess,
  studentId: string,
): Promise<MentalHealthMark | null> {
  const readable = markReachOf(actor);
  if (readable === null || !isUuid(studentId)) return null;
  const [found] = await db
    .select({
      category: mentalHealthMarks.category,
      observation: mentalHealthMarks.observation,
    })
    .from(mentalHealthMarks)
    .innerJoin(students, eq(students.id, mentalHealthMarks.studentId))
    .where(and(eq(mentalHealthMarks.studentId, studentId), readable));
  if (!found || found.category === null) return null;
  return { category: found.category, observation: found.observation };
}

/** One line of the log of a student's mark. */
export interface MarkLogLine {
  changedAt: Date;
  /** The name of the account that made the change. */
  changedBy: string;
  before: MarkInput;
  after: MarkInput;
}

/**
 * Every change of a student's mark, newest first, for an account with
 * the right to read the log, Kepala Unit. Null, with nothing read, for
 * any other account.
 */
export async function readMarkLog(
  db: Database,
  actor: AccountForAccess,
  studentId: string,
): Promise<MarkLogLine[] | null> {
  if (!may(actor.roles, "view_mental_health_mark_log")) return null;
  if (!isUuid(studentId)) return [];
  const rows = await db
    .select({
      changedAt: mentalHealthMarkChanges.changedAt,
      changedBy: accounts.name,
      categoryBefore: mentalHealthMarkChanges.categoryBefore,
      observationBefore: mentalHealthMarkChanges.observationBefore,
      categoryAfter: mentalHealthMarkChanges.categoryAfter,
      observationAfter: mentalHealthMarkChanges.observationAfter,
    })
    .from(mentalHealthMarkChanges)
    .innerJoin(accounts, eq(accounts.id, mentalHealthMarkChanges.changedBy))
    .where(eq(mentalHealthMarkChanges.studentId, studentId))
    .orderBy(desc(mentalHealthMarkChanges.changedAt));
  return rows.map((row) => ({
    changedAt: row.changedAt,
    changedBy: row.changedBy,
    before: {
      category: row.categoryBefore,
      observation: row.observationBefore,
    },
    after: { category: row.categoryAfter, observation: row.observationAfter },
  }));
}

/**
 * The students whose marks the account may read, as a condition on the
 * students, Pengasuh their own mentees only; null for an account without
 * the right, which is then given nothing about a mark.
 */
export function markReachOf(actor: AccountForAccess): SQL | null {
  if (!may(actor.roles, "view_mental_health_marks")) return null;
  return visibleTo(rowLimitForAction(actor, "view_mental_health_marks"));
}

/** A student with a mark, of the category given or of either. */
export function markedSql(category?: MarkCategory): SQL {
  const ofCategory =
    category === undefined
      ? sql`${mentalHealthMarks.category} is not null`
      : sql`${mentalHealthMarks.category} = ${category}`;
  return sql`exists (
    select 1 from ${mentalHealthMarks}
    where ${mentalHealthMarks.studentId} = ${students.id} and ${ofCategory}
  )`;
}

/** The number "Potensi kesehatan mental" and how many of it should be referred. */
export interface MarkCounts {
  marked: number;
  referred: number;
}

/** How many of the students `seen` lets through have a mark `reach` shows. */
export async function readMarkCounts(
  db: Database,
  seen: SQL | undefined,
  reach: SQL,
): Promise<MarkCounts> {
  const [counts] = await db
    .select({
      marked: sql<number>`(count(*) filter (where ${markedSql()}))::int`,
      referred: sql<number>`(count(*) filter (where ${markedSql("refer")}))::int`,
    })
    .from(students)
    .where(and(seen, reach));
  if (!counts) throw new Error("The numbers of the marks were not read.");
  return counts;
}

/** The marks of these students that `reach` shows, by student. */
export async function readMarksOf(
  db: Database,
  studentIds: string[],
  reach: SQL,
): Promise<Record<string, MentalHealthMark>> {
  const marks: Record<string, MentalHealthMark> = {};
  if (studentIds.length === 0) return marks;
  const rows = await db
    .select({
      studentId: mentalHealthMarks.studentId,
      category: mentalHealthMarks.category,
      observation: mentalHealthMarks.observation,
    })
    .from(mentalHealthMarks)
    .innerJoin(students, eq(students.id, mentalHealthMarks.studentId))
    .where(and(inArray(mentalHealthMarks.studentId, studentIds), reach));
  for (const { studentId, category, observation } of rows) {
    if (category !== null) marks[studentId] = { category, observation };
  }
  return marks;
}
