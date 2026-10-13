import { and, count, eq, gt } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { daysBefore } from "@/academic-periods/days-before";
import type { Database } from "@/db/connect";
import { mentorGroupMembers, mentoringNotes, students } from "@/db/schema";
import { LISTED_MEMBER } from "./member-conditions";

/** "Catatan pengasuhan 90 hari" looks this many days back, today included. */
export const RECENT_NOTE_DAYS = 90;

/**
 * How many mentoring notes of the last 90 days there are about the
 * members the page of a group lists, whoever wrote them. It is a number
 * for every account that may open the page of the group, also one with
 * no right to read a note: nothing of a note is read here but its day.
 */
export async function countRecentNotes(
  db: Database,
  groupId: string,
  day: string = campusDay(),
): Promise<number> {
  const [counted] = await db
    .select({ notes: count() })
    .from(mentoringNotes)
    .innerJoin(students, eq(students.id, mentoringNotes.studentId))
    .innerJoin(
      mentorGroupMembers,
      eq(mentorGroupMembers.studentId, students.id),
    )
    .where(
      and(
        eq(mentorGroupMembers.groupId, groupId),
        LISTED_MEMBER,
        gt(mentoringNotes.happenedOn, daysBefore(day, RECENT_NOTE_DAYS)),
      ),
    );
  return counted?.notes ?? 0;
}
