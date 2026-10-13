import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  mentorGroupMembers,
  mentoringAttendance,
  mentoringMeetings,
  students,
} from "@/db/schema";
import type { StoredMark, StoredMeeting } from "./meetings-overview";

/** A member an attendance list holds: an Aktif student who was not removed. */
const ACTIVE = sql`${students.status} = 'active' and ${students.deletedAt} is null`;

/** A member as an attendance list names them. */
export interface GroupMember {
  id: string;
  name: string;
  nim: string;
  /** "Kelas akademik". Null for a student without one. */
  className: string | null;
}

/**
 * The members of a group an attendance list holds, by name: those who
 * are Aktif today. A member on Cuti or Non aktif is not listed.
 */
export function listActiveMembers(
  db: Database,
  groupId: string,
): Promise<GroupMember[]> {
  return db
    .select({
      id: students.id,
      name: students.name,
      nim: students.nim,
      className: students.className,
    })
    .from(mentorGroupMembers)
    .innerJoin(students, eq(students.id, mentorGroupMembers.studentId))
    .where(and(eq(mentorGroupMembers.groupId, groupId), ACTIVE))
    .orderBy(asc(students.name), asc(students.nim));
}

/** The meetings of a group in one period whose list is saved, by number. */
export function readMeetings(
  db: Database,
  groupId: string,
  periodId: string,
): Promise<StoredMeeting[]> {
  return db
    .select({
      id: mentoringMeetings.id,
      number: mentoringMeetings.number,
      heldOn: mentoringMeetings.heldOn,
      topic: mentoringMeetings.topic,
      version: mentoringMeetings.version,
    })
    .from(mentoringMeetings)
    .where(
      and(
        eq(mentoringMeetings.groupId, groupId),
        eq(mentoringMeetings.periodId, periodId),
      ),
    )
    .orderBy(asc(mentoringMeetings.number));
}

/** Every mark saved for these meetings, of members of today or not. */
export function readMarks(
  db: Database,
  meetingIds: string[],
): Promise<StoredMark[]> {
  if (meetingIds.length === 0) return Promise.resolve([]);
  return db
    .select()
    .from(mentoringAttendance)
    .where(inArray(mentoringAttendance.meetingId, meetingIds));
}
