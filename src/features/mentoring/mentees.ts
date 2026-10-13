import { and, asc, eq, type SQL, sql } from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { students } from "@/db/schema";
import { menteesOf } from "@/mentoring/mentees-of";

const NOBODY = sql`false`;

/** A note is written only for a student who is Aktif and was not removed. */
const ACTIVE = sql`${students.status} = 'active' and ${students.deletedAt} is null`;

/**
 * The students a note may be written for under a row limit, for the
 * `where` of a read of students: the mentees of today who are Aktif. A
 * mentor who was replaced writes no more notes for that group. A limit to
 * a study program or to oneself opens nobody, since a note is written by
 * a mentor for their own mentees.
 */
export function writableFor(limit: RowLimit): SQL {
  if (limit.kind === "all") return ACTIVE;
  const ownMentee = menteesOf(limit.menteesOf);
  if (ownMentee === undefined) return NOBODY;
  return sql`${ACTIVE} and ${ownMentee}`;
}

/** Whether a note may be written for one student under a row limit. */
export async function isWritableFor(
  db: Database,
  limit: RowLimit,
  studentId: string,
): Promise<boolean> {
  // The database refuses to compare its ids with a text of another shape.
  if (!isUuid(studentId)) return false;
  const [student] = await db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.id, studentId), writableFor(limit)));
  return student !== undefined;
}

/** A student the form "Catatan baru" offers. */
export interface Mentee {
  id: string;
  name: string;
  nim: string;
}

/** The students a note may be written for under a row limit, by name. */
export function listMentees(db: Database, limit: RowLimit): Promise<Mentee[]> {
  return db
    .select({ id: students.id, name: students.name, nim: students.nim })
    .from(students)
    .where(writableFor(limit))
    .orderBy(asc(students.name), asc(students.nim));
}
