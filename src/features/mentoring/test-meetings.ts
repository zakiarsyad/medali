import { asc, eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  mentoringAttendance,
  mentoringMeetingChanges,
  mentoringMeetings,
} from "@/db/schema";
import type { MarksByStudent } from "@/mentoring/meeting-ids";

/**
 * Made-up records for the checks of meetings. Each file of checks uses a
 * Tahun akademik of its own: the database makes two checks that add the
 * same one wait for each other.
 */

export interface TestPeriod {
  id: string;
  startsOn: string;
  endsOn: string;
  /** A day inside the period, taken as today by the checks. */
  day: string;
}

/** The Ganjil period of a year, from August to January. */
export async function addTestPeriod(
  db: Database,
  startYear: number,
): Promise<TestPeriod> {
  const days = {
    startsOn: `${startYear}-08-01`,
    endsOn: `${startYear + 1}-01-31`,
  };
  const [period] = await db
    .insert(academicPeriods)
    .values({ startYear, term: "odd", ...days })
    .returning({ id: academicPeriods.id });
  if (!period) throw new Error("The period was not added.");
  return { id: period.id, ...days, day: `${startYear}-10-13` };
}

type TestMeeting = Pick<
  typeof mentoringMeetings.$inferInsert,
  "groupId" | "periodId" | "number" | "savedBy"
> &
  Partial<typeof mentoringMeetings.$inferInsert>;

/** A stored meeting with these marks, without a log line. */
export async function addTestMeeting(
  db: Database,
  meeting: TestMeeting,
  marks: MarksByStudent = {},
): Promise<string> {
  const [added] = await db
    .insert(mentoringMeetings)
    .values({
      heldOn: "2026-09-10",
      topic: "Topik uji",
      savedAt: new Date(),
      ...meeting,
    })
    .returning({ id: mentoringMeetings.id });
  if (!added) throw new Error("The meeting was not added.");
  const rows = Object.entries(marks).map(([studentId, mark]) => ({
    meetingId: added.id,
    studentId,
    mark,
  }));
  if (rows.length > 0) await db.insert(mentoringAttendance).values(rows);
  return added.id;
}

export function testMeetingsOf(db: Database, groupId: string) {
  return db
    .select()
    .from(mentoringMeetings)
    .where(eq(mentoringMeetings.groupId, groupId))
    .orderBy(asc(mentoringMeetings.number));
}

/** The marks kept for a meeting, by the id of the student. */
export async function testMarksOf(
  db: Database,
  meetingId: string,
): Promise<MarksByStudent> {
  const rows = await db
    .select()
    .from(mentoringAttendance)
    .where(eq(mentoringAttendance.meetingId, meetingId));
  const marks: MarksByStudent = {};
  for (const row of rows) marks[row.studentId] = row.mark;
  return marks;
}

/** The log lines of a meeting, the oldest first. */
export function testLogOf(db: Database, meetingId: string) {
  return db
    .select()
    .from(mentoringMeetingChanges)
    .where(eq(mentoringMeetingChanges.meetingId, meetingId))
    .orderBy(asc(mentoringMeetingChanges.changedAt));
}
