import { and, eq } from "drizzle-orm";
import type { MarksByStudent } from "@/mentoring/meeting-ids";
import type { Database } from "./connect";
import type { SamplePeriod } from "./sample-data";
import {
  type SampleMentoringMeeting,
  sampleMentoringMeetings,
} from "./sample-mentoring-meetings";
import type { SampleStudent } from "./sample-students";
import {
  academicPeriods,
  mentoringAttendance,
  mentoringMeetingChanges,
  mentoringMeetings,
} from "./schema";
import {
  type AddedGroup,
  mentorIdsByName,
  studentIdsByNim,
} from "./seed-mentor-groups";

function idOf<Key>(ids: Map<Key, string>, key: Key, what: string): string {
  const id = ids.get(key);
  if (id === undefined) {
    throw new Error(`A sample meeting names a ${what} that is missing.`);
  }
  return id;
}

export async function periodIdOf(
  db: Database,
  period: SamplePeriod,
): Promise<string> {
  const [stored] = await db
    .select({ id: academicPeriods.id })
    .from(academicPeriods)
    .where(
      and(
        eq(academicPeriods.startYear, period.startYear),
        eq(academicPeriods.term, period.term),
      ),
    );
  if (!stored) throw new Error("The sample period of the meetings is missing.");
  return stored.id;
}

/** The moment a sample list was saved: the afternoon of its day, or now. */
function savedAt(heldOn: string, now: Date): Date {
  const afternoon = new Date(`${heldOn}T16:00:00+07:00`);
  return afternoon < now ? afternoon : now;
}

interface NewMeeting {
  groupId: string;
  periodId: string;
  savedBy: string;
  savedAt: Date;
  marks: MarksByStudent;
}

/** Adds one meeting with its marks and its first log line. */
async function addMeeting(
  db: Database,
  sample: SampleMentoringMeeting,
  { marks, ...meeting }: NewMeeting,
): Promise<void> {
  const { number, heldOn, topic } = sample;
  const [added] = await db
    .insert(mentoringMeetings)
    .values({ ...meeting, number, heldOn, topic })
    .returning({ id: mentoringMeetings.id });
  if (!added) throw new Error("A sample meeting was not added.");
  const rows = Object.entries(marks).map(([studentId, mark]) => ({
    meetingId: added.id,
    studentId,
    mark,
  }));
  if (rows.length > 0) await db.insert(mentoringAttendance).values(rows);
  await db.insert(mentoringMeetingChanges).values({
    meetingId: added.id,
    changedBy: meeting.savedBy,
    changedAt: meeting.savedAt,
    heldOnAfter: heldOn,
    topicAfter: topic,
    marksAfter: marks,
  });
}

/**
 * Adds the sample meetings of the sample groups for the running period,
 * each with its marks and its first log line, as the work of the sample
 * Pengasuh who held the group on its day. The groups with their members
 * and mentors and the sample periods must be there already. `day` is
 * today on campus.
 */
export async function addSampleMentoringMeetings(
  db: Database,
  groups: AddedGroup[],
  students: SampleStudent[],
  period: SamplePeriod,
  day: string,
): Promise<void> {
  const samples = groups.map((group) => group.sample);
  const meetings = sampleMentoringMeetings(samples, students, period, day);
  if (meetings.length === 0) return;
  const groupIds = new Map(groups.map((group) => [group.sample, group.id]));
  const studentIds = await studentIdsByNim(db);
  const mentorIds = await mentorIdsByName(db, samples);
  const periodId = await periodIdOf(db, period);
  const now = new Date();

  for (const sample of meetings) {
    const marks: MarksByStudent = {};
    for (const { nim, mark } of sample.marks) {
      marks[idOf(studentIds, nim, "student")] = mark;
    }
    await addMeeting(db, sample, {
      groupId: idOf(groupIds, sample.group, "group"),
      periodId,
      savedBy: idOf(mentorIds, sample.savedBy, "Pengasuh"),
      savedAt: savedAt(sample.heldOn, now),
      marks,
    });
  }
}
