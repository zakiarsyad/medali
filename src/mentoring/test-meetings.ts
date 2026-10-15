import type { Database } from "@/db/connect";
import { mentoringAttendance, mentoringMeetings } from "@/db/schema";
import type { MarksByStudent } from "@/mentoring/meeting-ids";

/** Made-up meetings for the checks of every area that reads them. */

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
