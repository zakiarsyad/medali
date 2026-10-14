import { and, eq, gt, lt, lte, not, or, type SQL, sql } from "drizzle-orm";
import { dormLeaves, dormReturnReports } from "@/db/schema";

/*
 * Which leave is out, late or has a report that waits, for the `where`
 * of the reads of Perizinan asrama. Each says in the database what the
 * rule that marks one card says, so a filter and its cards agree.
 */

/**
 * Approved Izin pesiar and Izin khusus, written as the index of the leave
 * that may be out is, so the database reads only that index.
 */
const APPROVED_TO_RETURN = sql`${dormLeaves.status} = 'approved' and ${dormLeaves.kind} <> 'skip_activities'`;

function reportWaits(more?: SQL): SQL {
  return sql`exists (select 1 from ${dormReturnReports} where ${dormReturnReports.leaveId} = ${dormLeaves.id} and ${dormReturnReports.status} in ('waiting', 'verified') ${more === undefined ? sql`` : sql`and ${more}`})`;
}

/** Leave whose report of a return waits for BAM - BPHK or Pengelola Asrama. */
export const REPORT_WAITING =
  and(APPROVED_TO_RETURN, reportWaits()) ?? sql`false`;

/** Leave the resident is out on at a moment: started, with no return and no report that waits. */
export function outAt(now: Date): SQL {
  return (
    and(
      APPROVED_TO_RETURN,
      lte(dormLeaves.startsAt, now),
      not(reportWaits()),
    ) ?? sql`false`
  );
}

/**
 * Leave that is late at a moment: out past its return time, reported
 * after it, or back after it.
 */
export function lateAt(now: Date): SQL {
  const backLate = and(
    eq(dormLeaves.status, "completed"),
    gt(dormLeaves.returnedAt, dormLeaves.endsAt),
  );
  const outLate = and(outAt(now), lt(dormLeaves.endsAt, now));
  const reportedLate = and(
    APPROVED_TO_RETURN,
    reportWaits(sql`${dormReturnReports.sentAt} > ${dormLeaves.endsAt}`),
  );
  return or(backLate, outLate, reportedLate) ?? sql`false`;
}
