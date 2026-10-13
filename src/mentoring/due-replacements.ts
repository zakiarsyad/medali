import { and, asc, eq, lte } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import type { Database } from "@/db/connect";
import { mentorGroups, mentorReplacements } from "@/db/schema";
import { carryOutReplacement } from "./carry-out-replacement";
import { NOT_ENDED } from "./group-in-force";
import { holdsGroupToday } from "./holds-group-today";
import { waitForOtherMentorChanges } from "./mentor-change-lock";
import { IS_WAITING } from "./waiting-replacement";

interface DueReplacement {
  id: string;
  groupId: string;
}

/** The replacements that wait and whose start date has come, the earliest first. */
function readDue(db: Database, day: string): Promise<DueReplacement[]> {
  return db
    .select({
      id: mentorReplacements.id,
      groupId: mentorReplacements.groupId,
    })
    .from(mentorReplacements)
    .where(and(IS_WAITING, lte(mentorReplacements.startsOn, day)))
    .orderBy(asc(mentorReplacements.startsOn), asc(mentorReplacements.setAt));
}

/** Holds a group that is in force until the transaction ends. */
async function lockGroupInForce(tx: Database, groupId: string) {
  const [group] = await tx
    .select({ id: mentorGroups.id })
    .from(mentorGroups)
    .where(and(eq(mentorGroups.id, groupId), NOT_ENDED))
    .for("no key update");
  return group !== undefined;
}

/**
 * Holds a replacement while it still waits. Null once another request
 * carried it out, or once it was cancelled.
 */
async function lockWaiting(tx: Database, id: string) {
  const [waiting] = await tx
    .select({
      id: mentorReplacements.id,
      groupId: mentorReplacements.groupId,
      oldMentorId: mentorReplacements.oldMentorId,
      newMentorId: mentorReplacements.newMentorId,
      startsOn: mentorReplacements.startsOn,
      reason: mentorReplacements.reason,
    })
    .from(mentorReplacements)
    .where(and(eq(mentorReplacements.id, id), IS_WAITING))
    .for("update");
  return waiting ?? null;
}

/**
 * Carries out one replacement, once: of two requests at the same moment
 * the second waits for the group, then finds nothing left to do. The
 * group is held before the replacement, as the cancelling of a penetapan
 * does, so the two never wait for each other.
 *
 * One that cannot be carried out as it was written is left as it is, to
 * be cancelled by hand: its group is ended, its old mentor does not hold
 * the group, or its new mentor holds a group already.
 */
async function carryOutOne(db: Database, due: DueReplacement): Promise<void> {
  await db.transaction(async (tx) => {
    if (!(await lockGroupInForce(tx, due.groupId))) return;
    const waiting = await lockWaiting(tx, due.id);
    if (waiting === null) return;
    await waitForOtherMentorChanges(tx);
    if (await holdsGroupToday(tx, waiting.newMentorId)) return;
    await carryOutReplacement(tx, waiting);
  });
}

/**
 * Carries out every replacement that waits and whose start date has come
 * by the day on campus. Called before anything is shown to someone who is
 * signed in, so a replacement for a later date takes effect by itself
 * the first time the app is used on or after that date. Most of the time
 * it is one read that finds nothing.
 */
export async function carryOutDueReplacements(
  db: Database,
  day: string = campusDay(),
): Promise<void> {
  const due = await readDue(db, day);
  for (const one of due) {
    await carryOutOne(db, one);
  }
}
