import { eq, inArray } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  activityAttendances,
  activityClarifications,
  activitySchedules,
} from "@/db/schema";
import {
  addTestActivity,
  addTestActor,
  addTestAttendance,
  addTestClarification,
  addTestProgram,
  addTestSchedule,
  addTestStudentAccount,
  type TestStudentAccount,
} from "@/features/activities/test-records";
import { addTestActivity as addTestDormActivity } from "@/features/dorm/test-activities";
import {
  addTestCount,
  addTestClarification as addTestDormClarification,
} from "@/features/dorm/test-clarifications";
import { addApprovedLeave, addTestReport } from "@/features/dorm/test-returns";
import {
  addTestAppeal,
  addTestViolation,
} from "@/features/dorm/test-violations";
import { addTestRequest, photosOf } from "@/features/siku/test-requests";
import type { MemoryStore } from "@/files/memory-store";
import type { ProofKind } from "./proof-kinds";

/** Made-up records with a kept file of each kind, for the checks of this area. */

export interface ProofSetting {
  student: TestStudentAccount;
  deciderId: string;
  activityId: string;
  periodId: string;
}

/**
 * A student with an account, someone who decides, and the activities
 * their records belong to. `periodId` is a period the test file adds,
 * `program` and `nim` are of the file's own.
 */
export async function addProofSetting(
  db: Database,
  periodId: string,
  program: string,
  nim: string,
): Promise<ProofSetting> {
  const decider = await addTestActor(db, "Kepala Uji Berkas", ["head_of_unit"]);
  const programId = await addTestProgram(db, program);
  const student = await addTestStudentAccount(db, programId, {
    nim,
    name: "Mahasiswa Uji Berkas",
    cohortYear: 2025,
  });
  return {
    student,
    deciderId: decider.id,
    activityId: await addTestActivity(db, decider.id),
    periodId,
  };
}

/** The day of a moment by the clock of London, which the checks' moments keep. */
function dayOf(at: Date): string {
  return at.toISOString().slice(0, 10);
}

/** A record of one kind and where its file is kept. */
export interface TestProof {
  /** The record's key; for a SIKU photo, the key of the photo. */
  id: string;
  key: string;
}

export type TestProofs = Record<ProofKind, TestProof>;

async function addAttendance(
  db: Database,
  setting: ProofSetting,
  sentAt: Date,
  isDecided: boolean,
  key: string,
): Promise<string> {
  const scheduleId = await addTestSchedule(db, {
    activityId: setting.activityId,
    academicPeriodId: setting.periodId,
    changedBy: setting.deciderId,
    startsOn: dayOf(sentAt),
  });
  return addTestAttendance(db, setting.deciderId, {
    scheduleId,
    studentId: setting.student.studentId,
    status: isDecided ? "valid" : "waiting",
    sentAt,
    photoKey: key,
  });
}

async function addSikuPhoto(
  db: Database,
  setting: ProofSetting,
  sentAt: Date,
  isDecided: boolean,
  key: string,
): Promise<string> {
  const decided = {
    status: "rejected" as const,
    decidedBy: setting.deciderId,
    decidedAs: "head_of_unit" as const,
    decidedAt: sentAt,
    decisionNote: "Ditolak uji",
  };
  const requestId = await addTestRequest(db, setting.student.studentId, {
    day: dayOf(sentAt),
    sentAt,
    photoKeys: [key],
    more: isDecided ? decided : {},
  });
  const [photo] = await photosOf(db, requestId);
  if (!photo) throw new Error("The photo was not added.");
  return photo.id;
}

async function addReturnReport(
  db: Database,
  setting: ProofSetting,
  sentAt: Date,
  isDecided: boolean,
  key: string,
): Promise<string> {
  const day = dayOf(sentAt);
  const leaveId = await addApprovedLeave(
    db,
    setting.student.studentId,
    setting.deciderId,
    { startsAt: `${day}T09:00`, endsAt: `${day}T10:00` },
  );
  const decided = {
    status: "rejected" as const,
    verifiedBy: setting.deciderId,
    verifiedAt: sentAt,
    verifyNote: "Ditolak uji",
  };
  return addTestReport(db, leaveId, `${day}T10:00`, {
    sentAt,
    photoKey: key,
    ...(isDecided ? decided : {}),
  });
}

async function addActivityClarification(
  db: Database,
  setting: ProofSetting,
  sentAt: Date,
  isDecided: boolean,
  key: string,
): Promise<string> {
  const scheduleId = await addTestSchedule(db, {
    activityId: setting.activityId,
    academicPeriodId: setting.periodId,
    changedBy: setting.deciderId,
    startsOn: dayOf(sentAt),
  });
  return addTestClarification(db, setting.deciderId, {
    scheduleId,
    studentId: setting.student.studentId,
    status: isDecided ? "rejected" : "submitted",
    sentAt,
    decidedAt: isDecided ? sentAt : null,
    fileKey: key,
  });
}

async function addDormClarification(
  db: Database,
  setting: ProofSetting,
  sentAt: Date,
  isDecided: boolean,
  key: string,
): Promise<string> {
  const { studentId } = setting.student;
  const countId = await addTestCount(db, {
    activityId: await addTestDormActivity(db, setting.deciderId),
    day: dayOf(sentAt),
    byId: setting.deciderId,
    marks: { [studentId]: { isAbsent: true, note: "" } },
  });
  return addTestDormClarification(db, setting.deciderId, {
    countId,
    studentId,
    status: isDecided ? "rejected" : "submitted",
    sentAt,
    fileKey: key,
  });
}

async function addAppeal(
  db: Database,
  setting: ProofSetting,
  sentAt: Date,
  isDecided: boolean,
  key: string,
): Promise<string> {
  const violationId = await addTestViolation(
    db,
    setting.student.studentId,
    setting.deciderId,
    dayOf(sentAt),
  );
  const decided = {
    status: "rejected" as const,
    decidedBy: setting.deciderId,
    decidedAt: sentAt,
    decisionNote: "Ditolak uji",
  };
  return addTestAppeal(db, violationId, {
    sentAt,
    fileKey: key,
    fileName: "bukti-uji.pdf",
    fileContentType: "application/pdf",
    fileSize: 64,
    ...(isDecided ? decided : {}),
  });
}

const ADDERS: Record<
  ProofKind,
  (
    db: Database,
    setting: ProofSetting,
    sentAt: Date,
    isDecided: boolean,
    key: string,
  ) => Promise<string>
> = {
  attendance_photo: addAttendance,
  siku_photo: addSikuPhoto,
  return_photo: addReturnReport,
  activity_clarification: addActivityClarification,
  dorm_clarification: addDormClarification,
  appeal_proof: addAppeal,
};

/** The schedule a record of an activity kind belongs to. */
async function scheduleOf(
  db: Database,
  table: typeof activityAttendances | typeof activityClarifications,
  id: string,
): Promise<string> {
  const [row] = await db
    .select({ scheduleId: table.scheduleId })
    .from(table)
    .where(eq(table.id, id));
  if (!row) throw new Error("The record was not found.");
  return row.scheduleId;
}

/**
 * Marks the schedules of the attendance photo and the activity
 * clarification among `proofs` as removed, as "Hapus jadwal" does.
 * Gives back their keys.
 */
export async function removeSchedulesOf(
  db: Database,
  setting: ProofSetting,
  proofs: TestProofs,
): Promise<string[]> {
  const ids = [
    await scheduleOf(db, activityAttendances, proofs.attendance_photo.id),
    await scheduleOf(
      db,
      activityClarifications,
      proofs.activity_clarification.id,
    ),
  ];
  await db
    .update(activitySchedules)
    .set({ deletedAt: new Date(), deletedBy: setting.deciderId })
    .where(inArray(activitySchedules.id, ids));
  return ids;
}

const TEST_FILE = { bytes: new Uint8Array([1]), contentType: "image/jpeg" };

/**
 * One record of each kind with a file kept under a key of its own, sent
 * at `sentAt`: decided, or waiting when `isDecided` is false. The small
 * copy of a SIKU photo is kept under its key with -kecil after it. With
 * `store`, each file and copy is put in it too.
 */
export async function addTestProofs(
  db: Database,
  setting: ProofSetting,
  sentAt: Date,
  isDecided: boolean,
  store?: MemoryStore,
): Promise<TestProofs> {
  async function addOne(kind: ProofKind): Promise<TestProof> {
    const key = `${kind}/${crypto.randomUUID()}`;
    const id = await ADDERS[kind](db, setting, sentAt, isDecided, key);
    store?.files.set(key, TEST_FILE);
    if (kind === "siku_photo") store?.files.set(`${key}-kecil`, TEST_FILE);
    return { id, key };
  }
  return {
    attendance_photo: await addOne("attendance_photo"),
    siku_photo: await addOne("siku_photo"),
    return_photo: await addOne("return_photo"),
    activity_clarification: await addOne("activity_clarification"),
    dorm_clarification: await addOne("dorm_clarification"),
    appeal_proof: await addOne("appeal_proof"),
  };
}
