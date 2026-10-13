import { and, asc, eq, inArray, isNull, type SQL, sql } from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { mentorGroupMembers, mentorGroupMentors, students } from "@/db/schema";

const NOBODY = sql`false`;

/** A note is written only for a student who is Aktif and was not removed. */
const ACTIVE = sql`${students.status} = 'active' and ${students.deletedAt} is null`;

/**
 * A member of a group one of these mentors holds today. A mentor line
 * that has ended opens nothing: a mentor who was replaced writes no more
 * notes for that group.
 */
function menteeOf(mentorIds: string[]): SQL {
  const heldToday = and(
    inArray(mentorGroupMentors.mentorId, mentorIds),
    isNull(mentorGroupMentors.endsOn),
  );
  return sql`exists (
    select 1 from ${mentorGroupMembers}
    inner join ${mentorGroupMentors}
      on ${mentorGroupMentors.groupId} = ${mentorGroupMembers.groupId}
    where ${mentorGroupMembers.studentId} = ${students.id} and ${heldToday}
  )`;
}

/**
 * The students a note may be written for under a row limit, for the
 * `where` of a read of students: the Aktif mentees of today. A limit to a
 * study program or to oneself opens nobody, since a note is written by a
 * mentor for their own mentees.
 */
export function writableFor(limit: RowLimit): SQL {
  if (limit.kind === "all") return ACTIVE;
  if (limit.menteesOf.length === 0) return NOBODY;
  return sql`${ACTIVE} and ${menteeOf(limit.menteesOf)}`;
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
