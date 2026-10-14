import { and, desc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { Database } from "@/db/connect";
import { accounts, dormLeaves, dormReturnReports } from "@/db/schema";
import { OPEN_REPORT_STATUSES } from "./leave-ids";

/*
 * What reporting back, checking reports and recording returns share.
 */

/** A report that waits for BAM - BPHK or for Pengelola Asrama. */
export const OPEN_REPORT = inArray(
  dormReturnReports.status,
  OPEN_REPORT_STATUSES,
);

export type StoredLeave = typeof dormLeaves.$inferSelect;

/**
 * Holds a leave until the transaction ends, and reads it as it is then:
 * a report, a validation and a recorded return of one leave are made one
 * after another, and each sees what the one before it saved.
 */
export async function lockLeave(
  tx: Database,
  leaveId: string,
): Promise<StoredLeave | undefined> {
  const [leave] = await tx
    .select()
    .from(dormLeaves)
    .where(eq(dormLeaves.id, leaveId))
    .for("update");
  return leave;
}

/** Whether a leave has a report that waits. */
export async function hasOpenReport(
  db: Database,
  leaveId: string,
): Promise<boolean> {
  const [found] = await db
    .select({ id: dormReturnReports.id })
    .from(dormReturnReports)
    .where(and(eq(dormReturnReports.leaveId, leaveId), OPEN_REPORT))
    .limit(1);
  return found !== undefined;
}

const verifier = alias(accounts, "verifier");
const validator = alias(accounts, "validator");

/** The latest report of each of these leaves, with who checked it. */
function readLatest(db: Database, leaveIds: string[]) {
  return db
    .selectDistinctOn([dormReturnReports.leaveId], {
      report: dormReturnReports,
      verifiedBy: verifier.name,
      validatedBy: validator.name,
    })
    .from(dormReturnReports)
    .leftJoin(verifier, eq(verifier.id, dormReturnReports.verifiedBy))
    .leftJoin(validator, eq(validator.id, dormReturnReports.validatedBy))
    .where(inArray(dormReturnReports.leaveId, leaveIds))
    .orderBy(dormReturnReports.leaveId, desc(dormReturnReports.sentAt));
}

export type LatestStoredReport = Awaited<ReturnType<typeof readLatest>>[number];

/**
 * The latest report of each of these leaves, by the id of its leave, with
 * the names of who verified and validated it. One read, however many.
 */
export async function readLatestReports(
  db: Database,
  leaveIds: string[],
): Promise<Map<string, LatestStoredReport>> {
  if (leaveIds.length === 0) return new Map();
  const rows = await readLatest(db, leaveIds);
  return new Map(rows.map((row) => [row.report.leaveId, row]));
}

/** The note of whoever rejected a report; empty for any other. */
export function rejectionNoteOf(
  report: Pick<
    typeof dormReturnReports.$inferSelect,
    "status" | "validatedAt" | "validateNote" | "verifyNote"
  >,
): string {
  if (report.status !== "rejected") return "";
  if (report.validatedAt !== null) return report.validateNote;
  return report.verifyNote;
}
