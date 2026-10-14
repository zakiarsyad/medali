import { count, desc, eq } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { dormLeaves } from "@/db/schema";
import type { DormId } from "@/dorms/dorms";
import { PAGE_SIZE, pageWithin } from "@/ui/list-pages";
import type { ActivityRow } from "./activity-row";
import { coveredActivities } from "./leave-cover";
import { type LeaveRow, rowOfLeave } from "./leave-row";
import { readActivityRows } from "./leave-store";
import { type LatestReport, type OwnReturn, ownReturnOf } from "./return-rules";
import {
  type LatestStoredReport,
  readLatestReports,
  rejectionNoteOf,
} from "./return-store";
import { readStudentDorm } from "./student-dorm";

/** A request in "Riwayat izin saya", with what it says about the return. */
export interface OwnLeaveRow extends LeaveRow {
  return: OwnReturn;
}

/** One page of "Riwayat izin saya", the latest start first. */
export interface OwnLeave {
  dorm: DormId;
  rows: OwnLeaveRow[];
  /** How many requests the resident has in all. */
  matching: number;
  /** The page shown: the one asked for, or the last one there is. */
  page: number;
}

export type OwnLeaveAnswer =
  | { kind: "refused" }
  | { kind: "shown"; leave: OwnLeave };

type Stored = typeof dormLeaves.$inferSelect;

async function countOwn(db: Database, studentId: string): Promise<number> {
  const [counted] = await db
    .select({ matching: count() })
    .from(dormLeaves)
    .where(eq(dormLeaves.studentId, studentId));
  return counted?.matching ?? 0;
}

/** The versions of the activities the ITMK requests among these may cover. */
function readRowsFor(
  db: Database,
  stored: Stored[],
  dorm: DormId,
): Promise<ActivityRow[]> {
  const skipping = stored.filter((each) => each.kind === "skip_activities");
  if (skipping.length === 0) return Promise.resolve([]);
  const firstDays = skipping.map((each) => campusDay(each.startsAt)).sort();
  const lastDays = skipping.map((each) => campusDay(each.endsAt)).sort();
  const [first] = firstDays;
  const last = lastDays.at(-1);
  if (first === undefined || last === undefined) return Promise.resolve([]);
  return readActivityRows(db, [dorm], first, last);
}

function latestOf(stored: LatestStoredReport | undefined): LatestReport | null {
  if (stored === undefined) return null;
  const { report } = stored;
  return {
    status: report.status,
    sentAt: report.sentAt,
    rejectionNote: rejectionNoteOf(report),
  };
}

/**
 * "Riwayat izin saya": one page of the requests of the account's own
 * student, the latest start first, each ITMK with how many of their
 * dorm activities it covers, and each other approved leave with its
 * report of a return or its actual return at `moment`. Only the account's own student is ever
 * read. Refused for an account without the right, and for a student who
 * lives in no dorm today.
 */
export async function readOwnLeave(
  db: Database,
  account: Pick<Account, "roles" | "studentId">,
  page: number,
  moment: Date,
): Promise<OwnLeaveAnswer> {
  if (!may(account.roles, "ask_dorm_leave")) return { kind: "refused" };
  const { studentId } = account;
  if (studentId === null) return { kind: "refused" };
  const dorm = await readStudentDorm(db, studentId, campusDay(moment));
  if (dorm === null) return { kind: "refused" };

  const matching = await countOwn(db, studentId);
  const shownPage = pageWithin(page, matching);
  const stored = await db
    .select()
    .from(dormLeaves)
    .where(eq(dormLeaves.studentId, studentId))
    .orderBy(desc(dormLeaves.startsAt), desc(dormLeaves.sentAt))
    .limit(PAGE_SIZE)
    .offset((shownPage - 1) * PAGE_SIZE);
  const [activityRows, reports] = await Promise.all([
    readRowsFor(db, stored, dorm),
    readLatestReports(
      db,
      stored.map((each) => each.id),
    ),
  ]);
  const rows = stored.map((each) => {
    const covered =
      each.kind === "skip_activities"
        ? coveredActivities(activityRows, dorm, {
            start: each.startsAt,
            end: each.endsAt,
          })
        : [];
    const report = latestOf(reports.get(each.id));
    return {
      ...rowOfLeave(each, covered),
      return: ownReturnOf(each, report, moment),
    };
  });
  return {
    kind: "shown",
    leave: { dorm, rows, matching, page: shownPage },
  };
}
