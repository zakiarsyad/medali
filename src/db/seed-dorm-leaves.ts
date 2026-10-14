import { eq } from "drizzle-orm";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "./connect";
import type { SamplePeriod } from "./sample-data";
import {
  SAMPLE_LEAVE_RESIDENTS,
  type SampleLeave,
  type SampleReport,
  sampleDormLeaves,
  sampleReturns,
} from "./sample-dorm-leaves";
import { accountRoles, dormLeaves, dormReturnReports } from "./schema";
import { sampleResidents } from "./seed-dorm-counts";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** A sample time on campus, such as 2026-10-14T19:00, as a moment. */
function campusMoment(time: string): Date {
  return new Date(`${time}:00+07:00`);
}

/** The first sample account with a role. */
async function sampleAccount(db: Database, role: RoleId): Promise<string> {
  const [found] = await db
    .select({ id: accountRoles.accountId })
    .from(accountRoles)
    .where(eq(accountRoles.role, role))
    .limit(1);
  if (!found) throw new Error(`There is no sample account of ${role}.`);
  return found.id;
}

/** Who decides and checks the sample leave. */
interface SampleStaff {
  /** Pengelola Asrama, who decides the requests and validates reports. */
  managerId: string;
  /** BAM - BPHK, who verifies reports and records returns directly. */
  bamId: string;
}

/**
 * When a sample request was sent: a day before it starts, or an hour ago
 * for one that starts sooner than that.
 */
function sentAtOf(leave: SampleLeave, now: Date): Date {
  const dayBefore = campusMoment(leave.startsAt).getTime() - DAY_MS;
  return new Date(Math.min(dayBefore, now.getTime() - HOUR_MS));
}

function isDecided(status: SampleLeave["status"]): boolean {
  return (
    status === "approved" || status === "rejected" || status === "completed"
  );
}

function rowOf(
  leave: SampleLeave,
  studentId: string,
  staff: SampleStaff,
  now: Date,
): typeof dormLeaves.$inferInsert {
  const {
    resident: _resident,
    startsAt,
    endsAt,
    returnedAt,
    recordedDirectly,
    report: _report,
    ...parts
  } = leave;
  const sentAt = sentAtOf(leave, now);
  const anHourLater = new Date(sentAt.getTime() + HOUR_MS);
  const decided = isDecided(leave.status);
  return {
    ...parts,
    id: crypto.randomUUID(),
    studentId,
    startsAt: campusMoment(startsAt),
    endsAt: campusMoment(endsAt),
    sentAt,
    decidedBy: decided ? staff.managerId : null,
    decidedAt: decided ? anHourLater : null,
    cancelledAt: leave.status === "cancelled" ? anHourLater : null,
    returnedAt: returnedAt === null ? null : campusMoment(returnedAt),
    returnRecordedBy: recordedDirectly ? staff.bamId : null,
  };
}

/** Ten minutes after a moment, but never after now. */
function soonAfter(moment: Date, now: Date): Date {
  return new Date(Math.min(moment.getTime() + 10 * MINUTE_MS, now.getTime()));
}

function reportRowOf(
  report: SampleReport,
  leaveId: string,
  staff: SampleStaff,
  now: Date,
): typeof dormReturnReports.$inferInsert {
  const sentAt = campusMoment(report.sentAt);
  const checkedAt = soonAfter(sentAt, now);
  const isChecked = report.status !== "waiting";
  const isValidated = report.status === "validated";
  return {
    id: crypto.randomUUID(),
    leaveId,
    sentAt,
    status: report.status,
    verifiedBy: isChecked ? staff.bamId : null,
    verifiedAt: isChecked ? checkedAt : null,
    verifyNote: report.verifyNote,
    validatedBy: isValidated ? staff.managerId : null,
    validatedAt: isValidated ? soonAfter(checkedAt, now) : null,
    validateNote: report.validateNote,
  };
}

/**
 * Adds the sample leave requests around today, of the first residents
 * by name of the running sample period, decided by the sample Pengelola
 * Asrama, with the sample reports of a return, which the sample BAM -
 * BPHK verifies. Their photos are added by the sample photos command, as
 * those of the sample attendance are. `day` is today on campus.
 */
export async function addSampleDormLeaves(
  db: Database,
  period: SamplePeriod,
  day: string,
  now: Date = new Date(),
): Promise<void> {
  const residents = await sampleResidents(db, period);
  if (residents.length < SAMPLE_LEAVE_RESIDENTS) {
    throw new Error("There are too few sample residents for the leave.");
  }
  const staff = {
    managerId: await sampleAccount(db, "dorm_manager"),
    bamId: await sampleAccount(db, "bam_bphk"),
  };
  const leaves = [...sampleDormLeaves(day), ...sampleReturns(now)];
  const reports: (typeof dormReturnReports.$inferInsert)[] = [];
  const rows = leaves.map((leave) => {
    const resident = residents[leave.resident];
    if (!resident) throw new Error("A sample resident is missing.");
    const row = rowOf(leave, resident.id, staff, now);
    if (leave.report) {
      reports.push(reportRowOf(leave.report, row.id, staff, now));
    }
    return row;
  });
  await db.insert(dormLeaves).values(rows);
  await db.insert(dormReturnReports).values(reports);
}
