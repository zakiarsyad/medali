import { eq } from "drizzle-orm";
import type { Database } from "./connect";
import type { SamplePeriod } from "./sample-data";
import {
  SAMPLE_LEAVE_RESIDENTS,
  type SampleLeave,
  sampleDormLeaves,
} from "./sample-dorm-leaves";
import { accountRoles, dormLeaves } from "./schema";
import { sampleResidents } from "./seed-dorm-counts";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** A sample time on campus, such as 2026-10-14T19:00, as a moment. */
function campusMoment(time: string): Date {
  return new Date(`${time}:00+07:00`);
}

/** The sample Pengelola Asrama, who decides the sample requests. */
async function sampleManager(db: Database): Promise<string> {
  const [manager] = await db
    .select({ id: accountRoles.accountId })
    .from(accountRoles)
    .where(eq(accountRoles.role, "dorm_manager"))
    .limit(1);
  if (!manager) throw new Error("There is no sample Pengelola Asrama.");
  return manager.id;
}

/**
 * When a sample request was sent: a day before it starts, or an hour ago
 * for one that starts sooner than that.
 */
function sentAtOf(leave: SampleLeave, now: Date): Date {
  const dayBefore = campusMoment(leave.startsAt).getTime() - DAY_MS;
  return new Date(Math.min(dayBefore, now.getTime() - HOUR_MS));
}

function rowOf(
  leave: SampleLeave,
  studentId: string,
  managerId: string,
  now: Date,
): typeof dormLeaves.$inferInsert {
  const { resident: _resident, startsAt, endsAt, ...parts } = leave;
  const sentAt = sentAtOf(leave, now);
  const anHourLater = new Date(sentAt.getTime() + HOUR_MS);
  const isDecided = leave.status === "approved" || leave.status === "rejected";
  return {
    ...parts,
    id: crypto.randomUUID(),
    studentId,
    startsAt: campusMoment(startsAt),
    endsAt: campusMoment(endsAt),
    sentAt,
    decidedBy: isDecided ? managerId : null,
    decidedAt: isDecided ? anHourLater : null,
    cancelledAt: leave.status === "cancelled" ? anHourLater : null,
  };
}

/**
 * Adds the sample leave requests around today, of the first residents
 * by name of the running sample period, decided by the sample Pengelola
 * Asrama. `day` is today on campus.
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
  const managerId = await sampleManager(db);
  const rows = sampleDormLeaves(day).map((leave) => {
    const resident = residents[leave.resident];
    if (!resident) throw new Error("A sample resident is missing.");
    return rowOf(leave, resident.id, managerId, now);
  });
  await db.insert(dormLeaves).values(rows);
}
