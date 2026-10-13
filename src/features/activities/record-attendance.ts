import { and, eq } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { activityAttendanceChanges, activityAttendances } from "@/db/schema";
import { brokeUniqueRule } from "@/db/unique-violation";
import { waitForOtherAttendanceWrites } from "./attendance-lock";
import type { AttendanceStatus } from "./attendance-status";
import { VERIFY_NOT_ALLOWED } from "./decide-attendance";
import {
  ACTIVITY_NOT_FOUND,
  confirmWords,
  type ManualRecord,
  mustConfirm,
  NO_ACTIVITY_PICKED,
  NO_STUDENT_PICKED,
  parseRecord,
  type RecordAnswer,
  recordedWords,
  type SentRecord,
  STATUS_JUST_CHANGED,
  STUDENT_NOT_FOUND,
} from "./manual-record";
import { mayVerify } from "./may-verify";
import { readOwnSchedule } from "./own-schedule";
import { readActiveStudent } from "./record-student";
import { NEWEST_FIRST } from "./student-schedules";

/** The database's rule of one waiting or valid attendance per student and schedule. */
const ONE_WAITING_OR_VALID = "activity_attendances_one_waiting_or_valid";

interface Target {
  studentId: string;
  scheduleId: string;
}

/** Who records, when, and what the person agreed to replace. */
interface Recording {
  byId: string;
  at: Date;
  agreed: unknown;
}

type RecordEnd =
  | { kind: "recorded" }
  | { kind: "confirm"; status: AttendanceStatus };

function refused(error: string): RecordAnswer {
  return { state: { error, done: null }, confirm: null };
}

/**
 * The newest attendance of the student for the schedule, held with the
 * older ones so that nobody else changes them until this record is saved.
 */
async function holdNewest(db: Database, target: Target) {
  const held = await db
    .select({
      id: activityAttendances.id,
      status: activityAttendances.status,
      note: activityAttendances.note,
    })
    .from(activityAttendances)
    .where(
      and(
        eq(activityAttendances.studentId, target.studentId),
        eq(activityAttendances.scheduleId, target.scheduleId),
      ),
    )
    .orderBy(NEWEST_FIRST)
    .for("update");
  return held[0];
}

type Decided = ManualRecord & { decidedAt: Date; decidedBy: string };

/**
 * Puts the record in place of the attendance with the key `beforeId`, or
 * adds it as a new one when there is none. Gives the key it is kept under.
 */
async function keep(
  db: Database,
  beforeId: string | undefined,
  target: Target,
  decided: Decided,
): Promise<string> {
  if (beforeId !== undefined) {
    await db
      .update(activityAttendances)
      .set(decided)
      .where(eq(activityAttendances.id, beforeId));
    return beforeId;
  }
  const [added] = await db
    .insert(activityAttendances)
    .values({ ...target, ...decided })
    .returning({ id: activityAttendances.id });
  if (!added) throw new Error("The attendance was not added.");
  return added.id;
}

/**
 * Keeps the record and writes the line of the log, both or neither. A
 * student without an attendance for the schedule gets a new one, which
 * has no photo and no time sent. Otherwise their newest one is replaced
 * and keeps its photo, but only once the person agreed to replace the
 * status it has now.
 */
function save(
  db: Database,
  target: Target,
  record: ManualRecord,
  { byId, at, agreed }: Recording,
): Promise<RecordEnd> {
  return db.transaction(async (tx) => {
    await waitForOtherAttendanceWrites(tx, target.studentId, target.scheduleId);
    const before = await holdNewest(tx, target);
    if (before !== undefined && mustConfirm(before.status, agreed)) {
      return { kind: "confirm", status: before.status };
    }
    const decided = { ...record, decidedAt: at, decidedBy: byId };
    const attendanceId = await keep(tx, before?.id, target, decided);
    await tx.insert(activityAttendanceChanges).values({
      attendanceId,
      changedBy: byId,
      changedAt: at,
      statusBefore: before?.status ?? null,
      noteBefore: before?.note ?? null,
      statusAfter: record.status,
      noteAfter: record.note,
    });
    return { kind: "recorded" };
  });
}

/**
 * Saves, or says to press again when the database refused the record
 * because the student got a waiting or valid attendance at that moment,
 * as when their photo arrived: nothing is saved then.
 */
async function saveOrAskAgain(
  ...parts: Parameters<typeof save>
): Promise<RecordEnd | null> {
  try {
    return await save(...parts);
  } catch (error) {
    if (!brokeUniqueRule(error, ONE_WAITING_OR_VALID)) throw error;
    return null;
  }
}

/**
 * "Simpan" of "Catat kehadiran manual atau dispensasi": records that an
 * Aktif student was present, or excused, at one of their activities
 * that has started by `at`, the moment on the server's clock. For an
 * account that may verify attendance; anyone else is refused before
 * anything is read. Nothing in `sent` is trusted. When the student
 * already has a status there, nothing is saved until the person agreed
 * to replace exactly that status.
 */
export async function recordAttendance(
  db: Database,
  account: AccountForAccess,
  sent: SentRecord,
  at: Date,
): Promise<RecordAnswer> {
  if (!mayVerify(account)) return refused(VERIFY_NOT_ALLOWED);
  if (sent.studentId === "") return refused(NO_STUDENT_PICKED);
  if (sent.scheduleId === "") return refused(NO_ACTIVITY_PICKED);
  const record = parseRecord(sent.kind, sent.note);
  if (!record.ok) return refused(record.error);
  const student = await readActiveStudent(db, sent.studentId);
  if (student === null) return refused(STUDENT_NOT_FOUND);
  const schedule =
    typeof sent.scheduleId === "string"
      ? await readOwnSchedule(
          db,
          { ...student, isActive: true },
          sent.scheduleId,
        )
      : null;
  const hasStarted = schedule !== null && schedule.startsOn <= campusDay(at);
  if (!hasStarted) return refused(ACTIVITY_NOT_FOUND);

  const end = await saveOrAskAgain(
    db,
    { studentId: student.id, scheduleId: schedule.id },
    record.value,
    { byId: account.id, at, agreed: sent.replaces },
  );
  if (end === null) return refused(STATUS_JUST_CHANGED);
  if (end.kind === "confirm") {
    const error = confirmWords(student.name, end.status);
    return { state: { error, done: null }, confirm: end.status };
  }
  return {
    state: { error: null, done: recordedWords(student.name) },
    confirm: null,
  };
}
