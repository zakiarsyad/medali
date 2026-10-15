import type { Database } from "./connect";
import type { SamplePeriod } from "./sample-data";
import {
  SAMPLE_VIOLATION_RESIDENTS,
  type SampleViolation,
  sampleDormViolations,
} from "./sample-dorm-violations";
import { dormViolationChanges, dormViolations } from "./schema";
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

/**
 * Adds the sample dorm violations around now, of the first residents by
 * name of the running sample period, in the dorm each lives in. The
 * sample BAM - BPHK records those announced on even days and the sample
 * BAM - KI the others; every entry and the one cancel have their line in
 * the log.
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
  }
  await db.insert(dormViolations).values(rows);
  await db.insert(dormViolationChanges).values(lines);
}
