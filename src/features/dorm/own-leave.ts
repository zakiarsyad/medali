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
import { readStudentDorm } from "./student-dorm";

/** One page of "Riwayat izin saya", the latest start first. */
export interface OwnLeave {
  dorm: DormId;
  rows: LeaveRow[];
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

/**
 * "Riwayat izin saya": one page of the requests of the account's own
 * student, the latest start first, each ITMK with how many of their
 * dorm activities it covers. Only the account's own student is ever
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
  const activityRows = await readRowsFor(db, stored, dorm);
  const rows = stored.map((each) => {
    const covered =
      each.kind === "skip_activities"
        ? coveredActivities(activityRows, dorm, {
            start: each.startsAt,
            end: each.endsAt,
          })
        : [];
    return rowOfLeave(each, covered);
  });
  return {
    kind: "shown",
    leave: { dorm, rows, matching, page: shownPage },
  };
}
