import { eq, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { mentoringAttendance, mentoringMeetings } from "@/db/schema";
import type { AttendanceMark } from "@/mentoring/meeting-ids";
import { type MarkTally, NO_MARKS } from "./attendance-score";

function countOf(mark: AttendanceMark) {
  return sql<number>`count(*) filter (where ${mentoringAttendance.mark} = ${mark})::int`;
}

/**
 * The marks of each student on the saved meeting lists of a period, as a
 * table to join: one row for a student who is on a list, whatever group
 * the list is of. A meeting exists only once its list is saved, so a
 * meeting with no list gives nobody a mark.
 */
export function markTallies(db: Database, periodId: string) {
  return db
    .select({
      studentId: mentoringAttendance.studentId,
      present: countOf("present").as("present"),
      excused: countOf("excused").as("excused"),
      sick: countOf("sick").as("sick"),
      absent: countOf("absent").as("absent"),
    })
    .from(mentoringAttendance)
    .innerJoin(
      mentoringMeetings,
      eq(mentoringMeetings.id, mentoringAttendance.meetingId),
    )
    .where(eq(mentoringMeetings.periodId, periodId))
    .groupBy(mentoringAttendance.studentId)
    .as("mark_tallies");
}

/** The marks of one student on the saved meeting lists of a period. */
export async function readOwnMarks(
  db: Database,
  studentId: string,
  periodId: string,
): Promise<MarkTally> {
  const tallies = markTallies(db, periodId);
  const [own] = await db
    .select({
      present: tallies.present,
      excused: tallies.excused,
      sick: tallies.sick,
      absent: tallies.absent,
    })
    .from(tallies)
    .where(eq(tallies.studentId, studentId));
  return own ?? NO_MARKS;
}
