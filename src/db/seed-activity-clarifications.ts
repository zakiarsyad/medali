import { eq, inArray } from "drizzle-orm";
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

/** A sample clarification with the keys of its student and its schedule. */
interface Placed {
  sample: SampleClarification;
  studentId: string;
  scheduleId: string;
}

/** A sample student asks once for a schedule at most, so the two name one row. */
function pairOf(row: { studentId: string; scheduleId: string }): string {
  return `${row.studentId} ${row.scheduleId}`;
}

/** An accepted sample clarification, as far as the attendance needs it. */
interface Acceptance extends Placed {
  status: "valid" | "dispensation";
  decidedAt: Date;
}

function acceptancesAmong(placed: Placed[]): Acceptance[] {
  const accepted: Acceptance[] = [];
  for (const each of placed) {
    const { acceptedAs, decidedAt } = each.sample;
    if (acceptedAs === null || decidedAt === null) continue;
    accepted.push({ ...each, status: acceptedAs, decidedAt });
  }
  return accepted;
}

/**
 * Gives the attendance what each accepted clarification gives it: the
 * student's attendance for the schedule becomes Hadir or Dispensasi, or
 * one is recorded when nothing was sent, and the log of attendance
 * decisions gets its line. A sample student has one attendance for a
 * schedule at most. Everything that can be is written in one go: the
 * checks load the sample data often.
 */
async function acceptAttendances(
  db: Database,
  accepted: Acceptance[],
  decidedBy: string,
): Promise<void> {
  if (accepted.length === 0) return;
  const kept = await db
    .select()
    .from(activityAttendances)
    .where(
      inArray(
        activityAttendances.studentId,
        accepted.map(({ studentId }) => studentId),
      ),
    );
  const before = new Map(kept.map((each) => [pairOf(each), each]));
  const given = accepted.map((each) => ({
    scheduleId: each.scheduleId,
    studentId: each.studentId,
    status: each.status,
    note: acceptedNote(each.sample.reason),
    decidedAt: each.decidedAt,
    decidedBy,
  }));
  const changed = given.filter((each) => before.has(pairOf(each)));
  const recorded = given.filter((each) => !before.has(pairOf(each)));

  for (const { scheduleId, studentId, ...after } of changed) {
    const { id } = found(before.get(pairOf({ scheduleId, studentId })), "row");
    await db
      .update(activityAttendances)
      .set(after)
      .where(eq(activityAttendances.id, id));
  }
  const added =
    recorded.length === 0
      ? []
      : await db.insert(activityAttendances).values(recorded).returning();
  const ids = new Map(added.map((each) => [pairOf(each), each.id]));

  await db.insert(activityAttendanceChanges).values(
    given.map((each) => {
      const was = before.get(pairOf(each));
      return {
        attendanceId: was?.id ?? found(ids.get(pairOf(each)), "attendance"),
        changedBy: decidedBy,
        changedAt: each.decidedAt,
        statusBefore: was?.status ?? null,
        noteBefore: was?.note ?? null,
        statusAfter: each.status,
        noteAfter: each.note,
      };
    }),
  );
}

/** The line each decided sample clarification has in the log of decisions. */
async function addDecisionLines(
  db: Database,
  placed: Placed[],
  ids: Map<string, string>,
  decidedBy: string,
): Promise<void> {
  const lines = [];
  for (const each of placed) {
    const { status, acceptedAs, note, decidedAt } = each.sample;
    if (decidedAt === null) continue;
    lines.push({
      clarificationId: found(ids.get(pairOf(each)), "clarification"),
      changedBy: decidedBy,
      changedAt: decidedAt,
      statusBefore: "submitted" as const,
      statusAfter: status,
      acceptedAs,
      note,
    });
  }
  if (lines.length === 0) return;
  await db.insert(activityClarificationChanges).values(lines);
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
  const placed: Placed[] = clarifications.map((sample) => ({
    sample,
    studentId: found(studentIds.get(sample.nim), "student"),
    scheduleId: found(scheduleIds.get(sample.schedule), "schedule"),
  }));

  const added = await db
    .insert(activityClarifications)
    .values(
      placed.map(({ sample, studentId, scheduleId }) => {
        const { nim, schedule, ...asked } = sample;
        const decidedBy = asked.decidedAt === null ? null : decider.id;
        return { ...asked, ...paper, studentId, scheduleId, decidedBy };
      }),
    )
    .returning({
      id: activityClarifications.id,
      studentId: activityClarifications.studentId,
      scheduleId: activityClarifications.scheduleId,
    });
  const ids = new Map(added.map((each) => [pairOf(each), each.id]));
  await addDecisionLines(db, placed, ids, decider.id);
  await acceptAttendances(db, acceptancesAmong(placed), decider.id);
}
