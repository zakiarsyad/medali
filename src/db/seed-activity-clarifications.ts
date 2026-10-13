import { and, eq } from "drizzle-orm";
import { firstAccountWithRole } from "@/auth/accounts";
import { acceptedNote } from "@/features/activities/clarification-reasons";
import { PDF } from "@/files/file-kinds";
import type { Database } from "./connect";
import { sampleActivityAttendances } from "./sample-activity-attendances";
import {
  type SampleClarification,
  sampleClarifications,
} from "./sample-activity-clarifications";
import {
  SAMPLE_PAPER_NAME,
  samplePaperBytes,
} from "./sample-clarification-paper";
import type { SampleStudent } from "./sample-students";
import {
  activityAttendanceChanges,
  activityAttendances,
  activityClarificationChanges,
  activityClarifications,
} from "./schema";
import type { AddedSchedule } from "./seed-activity-schedules";
import { studentIdsByNim } from "./seed-mentor-groups";

function found<Value>(value: Value | undefined, what: string): Value {
  if (value === undefined) {
    throw new Error(`A sample clarification names a ${what} that is missing.`);
  }
  return value;
}

/** An accepted sample clarification, with the rows it belongs to. */
interface Acceptance {
  scheduleId: string;
  studentId: string;
  status: "valid" | "dispensation";
  note: string;
  decidedAt: Date;
  decidedBy: string;
}

/**
 * Gives the attendance what an accepted clarification gives it: the
 * student's attendance for the schedule becomes Hadir or Dispensasi, or
 * one is recorded when nothing was sent, and the log of attendance
 * decisions gets its line. A sample student has one attendance for a
 * schedule at most.
 */
async function acceptAttendance(db: Database, accepted: Acceptance) {
  const { scheduleId, studentId, status, note, decidedAt, decidedBy } =
    accepted;
  const after = { status, note, decidedAt, decidedBy };
  const [before] = await db
    .select()
    .from(activityAttendances)
    .where(
      and(
        eq(activityAttendances.scheduleId, scheduleId),
        eq(activityAttendances.studentId, studentId),
      ),
    );
  const log = {
    changedBy: decidedBy,
    changedAt: decidedAt,
    statusAfter: status,
    noteAfter: note,
  };
  if (before) {
    await db
      .update(activityAttendances)
      .set(after)
      .where(eq(activityAttendances.id, before.id));
    await db.insert(activityAttendanceChanges).values({
      ...log,
      attendanceId: before.id,
      statusBefore: before.status,
      noteBefore: before.note,
    });
    return;
  }
  const [added] = await db
    .insert(activityAttendances)
    .values({ ...after, scheduleId, studentId })
    .returning({ id: activityAttendances.id });
  await db
    .insert(activityAttendanceChanges)
    .values({ ...log, attendanceId: found(added, "new attendance").id });
}

/**
 * Adds the sample clarifications of the sample students, decided by the
 * sample Penilai Mahasiswa, each with its line in the log of decisions
 * and, when accepted, the attendance it gives. None has its file yet:
 * the drawn paper is given where there is a file storage, with the sample
 * photos. The sample attendance must be there already. `day` is today on
 * campus.
 */
export async function addSampleClarifications(
  db: Database,
  schedules: AddedSchedule[],
  students: SampleStudent[],
  day: string,
): Promise<void> {
  const samples = schedules.map((schedule) => schedule.sample);
  const attendances = sampleActivityAttendances(samples, students, day);
  const clarifications = sampleClarifications(
    samples,
    students,
    attendances,
    day,
  );
  if (clarifications.length === 0) return;
  const studentIds = await studentIdsByNim(db);
  const scheduleIds = new Map(schedules.map(({ id, sample }) => [sample, id]));
  const decider = found(
    (await firstAccountWithRole(db, "assessor")) ?? undefined,
    "Penilai Mahasiswa",
  );
  const paper = {
    fileName: SAMPLE_PAPER_NAME,
    fileContentType: PDF.contentType,
    fileSize: samplePaperBytes().length,
  };

  for (const clarification of clarifications) {
    const { nim, schedule, ...asked } = clarification;
    const studentId = found(studentIds.get(nim), "student");
    const scheduleId = found(scheduleIds.get(schedule), "schedule");
    const decidedBy = asked.decidedAt === null ? null : decider.id;
    const [added] = await db
      .insert(activityClarifications)
      .values({ ...asked, ...paper, studentId, scheduleId, decidedBy })
      .returning({ id: activityClarifications.id });
    await addDecision(db, found(added, "new clarification").id, {
      clarification,
      studentId,
      scheduleId,
      decidedBy: decider.id,
    });
  }
}

/** What the decision of one sample clarification leaves behind, if it has one. */
async function addDecision(
  db: Database,
  clarificationId: string,
  decided: {
    clarification: SampleClarification;
    studentId: string;
    scheduleId: string;
    decidedBy: string;
  },
): Promise<void> {
  const { clarification, studentId, scheduleId, decidedBy } = decided;
  const { status, acceptedAs, note, reason, decidedAt } = clarification;
  if (decidedAt === null) return;
  await db.insert(activityClarificationChanges).values({
    clarificationId,
    changedBy: decidedBy,
    changedAt: decidedAt,
    statusBefore: "submitted",
    statusAfter: status,
    acceptedAs,
    note,
  });
  if (acceptedAs === null) return;
  await acceptAttendance(db, {
    scheduleId,
    studentId,
    status: acceptedAs,
    note: acceptedNote(reason),
    decidedAt,
    decidedBy,
  });
}
