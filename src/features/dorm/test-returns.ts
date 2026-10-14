import { eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { dormLeaves, dormReturnReports } from "@/db/schema";
import type { LeaveKind } from "./leave-ids";

/** Made-up approved leave and reports of a return, for the checks of this area. */

/** A time on campus, such as 2900-10-13T16:00, as a moment. */
export function campusAt(time: string): Date {
  return new Date(`${time}:00+07:00`);
}

type LeaveRow = typeof dormLeaves.$inferInsert;

/**
 * Approved leave of a student, decided by `deciderId`, from and to times
 * on campus such as 2900-10-13T09:00. Izin khusus unless told otherwise.
 */
export async function addApprovedLeave(
  db: Database,
  studentId: string,
  deciderId: string,
  times: { startsAt: string; endsAt: string; kind?: LeaveKind },
  more: Partial<LeaveRow> = {},
): Promise<string> {
  const id = crypto.randomUUID();
  const kind = times.kind ?? "special";
  const isSkipping = kind === "skip_activities";
  const startsAt = campusAt(times.startsAt);
  await db.insert(dormLeaves).values({
    id,
    studentId,
    kind,
    startsAt,
    endsAt: campusAt(times.endsAt),
    specialReason: kind === "special" ? "family" : null,
    purpose: "Urusan keluarga uji",
    destination: isSkipping ? "" : "Jakarta",
    contact: isSkipping ? "" : "0812-0000-0000",
    sentAt: new Date(startsAt.getTime() - 24 * 60 * 60 * 1000),
    status: "approved",
    decidedBy: deciderId,
    decidedAt: new Date(startsAt.getTime() - 12 * 60 * 60 * 1000),
    ...more,
  });
  return id;
}

type ReportRow = typeof dormReturnReports.$inferInsert;

/** A report of a return of a leave sent at a time on campus, waiting unless told otherwise. */
export async function addTestReport(
  db: Database,
  leaveId: string,
  sentAt: string,
  more: Partial<ReportRow> = {},
): Promise<string> {
  const id = crypto.randomUUID();
  await db.insert(dormReturnReports).values({
    id,
    leaveId,
    sentAt: campusAt(sentAt),
    photoKey: `return-photos/${id}`,
    ...more,
  });
  return id;
}

/** A report as it is kept, or undefined for none. */
export async function reportById(db: Database, id: string) {
  const [kept] = await db
    .select()
    .from(dormReturnReports)
    .where(eq(dormReturnReports.id, id));
  return kept;
}

/** The reports of a leave as they are kept, the earliest first. */
export function reportsOf(db: Database, leaveId: string) {
  return db
    .select()
    .from(dormReturnReports)
    .where(eq(dormReturnReports.leaveId, leaveId))
    .orderBy(dormReturnReports.sentAt);
}
