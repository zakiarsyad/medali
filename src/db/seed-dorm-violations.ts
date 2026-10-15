import { eq } from "drizzle-orm";
import { PDF } from "@/files/file-kinds";
import type { Database } from "./connect";
import {
  SAMPLE_PAPER_NAME,
  samplePaperBytes,
} from "./sample-clarification-paper";
import type { SamplePeriod } from "./sample-data";
import {
  SAMPLE_VIOLATION_RESIDENTS,
  type SampleAppeal,
  type SampleViolation,
  sampleDormViolations,
} from "./sample-dorm-violations";
import {
  accounts,
  dormViolationAppeals,
  dormViolationChanges,
  dormViolations,
} from "./schema";
import { sampleResidents } from "./seed-dorm-counts";
import { sampleAccount } from "./seed-dorm-leaves";

const MINUTE_MS = 60 * 1000;

/**
 * When a sample violation was recorded: half an hour before it is
 * announced, but never after now, and never before its day began.
 */
function enteredAtOf(violation: SampleViolation, now: Date): Date {
  const dayStart = new Date(`${violation.day}T00:00:00+07:00`).getTime();
  const halfHourBefore = violation.announcedAt.getTime() - 30 * MINUTE_MS;
  return new Date(Math.max(dayStart, Math.min(halfHourBefore, now.getTime())));
}

/** One key for the violations announced at one moment, as one save keeps them. */
function batchOf(keys: Map<number, string>, announcedAt: Date): string {
  const moment = announcedAt.getTime();
  const kept = keys.get(moment);
  if (kept !== undefined) return kept;
  const made = crypto.randomUUID();
  keys.set(moment, made);
  return made;
}

/** A sample violation that has an appeal, once it is kept. */
interface AppealedViolation {
  violationId: string;
  studentId: string;
  appeal: SampleAppeal;
}

const HOUR_MS = 60 * MINUTE_MS;

async function accountOfStudent(
  db: Database,
  studentId: string,
): Promise<string> {
  const [found] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(eq(accounts.studentId, studentId));
  if (!found) throw new Error("A sample resident has no account.");
  return found.id;
}

/**
 * Adds the appeals of the sample violations. Each is sent by the
 * resident's own account; the sample BAM - KI accepts and the sample
 * BAM - BPHK rejects, an hour after it was sent. Its proof is the drawn
 * sample paper, which the sample files command puts in the file storage
 * later. Each send and decision has its line in the log.
 */
async function addSampleAppeals(
  db: Database,
  appealed: AppealedViolation[],
  [bphk = "", ki = ""]: string[],
): Promise<void> {
  const rows: (typeof dormViolationAppeals.$inferInsert)[] = [];
  const lines: (typeof dormViolationChanges.$inferInsert)[] = [];
  const proof = {
    fileName: SAMPLE_PAPER_NAME,
    fileContentType: PDF.contentType,
    fileSize: samplePaperBytes().length,
  };
  for (const { violationId, studentId, appeal } of appealed) {
    const sentBy = await accountOfStudent(db, studentId);
    const decided = new Date(appeal.sentAt.getTime() + HOUR_MS);
    const decidedBy = appeal.status === "accepted" ? ki : bphk;
    const decision =
      appeal.status === "waiting" ? {} : { decidedBy, decidedAt: decided };
    rows.push({
      violationId,
      reason: appeal.reason,
      ...(appeal.hasProof ? proof : {}),
      sentAt: appeal.sentAt,
      status: appeal.status,
      decisionNote: appeal.note,
      ...decision,
    });
    lines.push({
      violationId,
      changedBy: sentBy,
      changedAt: appeal.sentAt,
      action: "appealed",
    });
    if (appeal.status === "waiting") continue;
    lines.push({
      violationId,
      changedBy: decidedBy,
      changedAt: decided,
      action:
        appeal.status === "accepted" ? "appeal_accepted" : "appeal_rejected",
    });
  }
  await db.insert(dormViolationAppeals).values(rows);
  await db.insert(dormViolationChanges).values(lines);
}

/**
 * Adds the sample dorm violations around now, of the first residents by
 * name of the running sample period, in the dorm each lives in, with
 * their appeals. The sample BAM - BPHK records those announced on even
 * days and the sample BAM - KI the others; every entry, the one cancel,
 * and every appeal and decision have their line in the log.
 */
export async function addSampleDormViolations(
  db: Database,
  period: SamplePeriod,
  now: Date = new Date(),
): Promise<void> {
  const residents = await sampleResidents(db, period);
  if (residents.length < SAMPLE_VIOLATION_RESIDENTS) {
    throw new Error("There are too few sample residents for the violations.");
  }
  const recorders = [
    await sampleAccount(db, "bam_bphk"),
    await sampleAccount(db, "bam_compliance"),
  ];
  const keys = new Map<number, string>();
  const rows: (typeof dormViolations.$inferInsert)[] = [];
  const lines: (typeof dormViolationChanges.$inferInsert)[] = [];
  const appealed: AppealedViolation[] = [];
  for (const violation of sampleDormViolations(now)) {
    const resident = residents[violation.resident];
    if (!resident) throw new Error("A sample resident is missing.");
    const id = crypto.randomUUID();
    const by = recorders[Number(violation.day.slice(-1)) % 2] ?? "";
    const enteredAt = enteredAtOf(violation, now);
    const cancel = violation.isCancelled
      ? { cancelledBy: by, cancelledAt: now }
      : {};
    rows.push({
      id,
      batchId: batchOf(keys, violation.announcedAt),
      studentId: resident.id,
      dorm: resident.dorm,
      day: violation.day,
      reason: violation.reason,
      punishment: violation.punishment,
      otherPunishment: violation.otherPunishment,
      announcedAt: violation.announcedAt,
      enteredBy: by,
      enteredAt,
      ...cancel,
    });
    const line = { violationId: id, changedBy: by };
    lines.push({ ...line, changedAt: enteredAt, action: "entered" });
    if (violation.isCancelled) {
      lines.push({ ...line, changedAt: now, action: "cancelled" });
    }
    if (violation.appeal !== null) {
      appealed.push({
        violationId: id,
        studentId: resident.id,
        appeal: violation.appeal,
      });
    }
  }
  await db.insert(dormViolations).values(rows);
  await db.insert(dormViolationChanges).values(lines);
  await addSampleAppeals(db, appealed, recorders);
}
