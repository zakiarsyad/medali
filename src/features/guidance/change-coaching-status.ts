import { and, eq } from "drizzle-orm";
import { type AccountForAccess, may } from "@/auth/access";
import { listedForCoaching } from "@/character-scores/coaching-listed";
import { FIRST_COACHING_STATUS } from "@/character-scores/coaching-status";
import { latestAssessments } from "@/character-scores/latest-assessments";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { coachingStatusChanges, coachingStatuses, students } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import {
  type CoachingChange,
  type CoachingOutcome,
  parseCoachingChange,
  type ShownCoachingStatus,
} from "./coaching-change";
import {
  COACHING_OUTDATED,
  NOT_ALLOWED_TO_CHANGE,
  NOT_IN_COACHING,
} from "./coaching-messages";
import { coachingChangeReachOf } from "./coaching-reach";

/**
 * The name of a student the actor may change the status of, Aktif and
 * listed by their latest assessment, or null. The student is held until
 * the change ends, so a second change of the same student, the first one
 * among them, waits here for the first.
 */
async function holdStudent(
  tx: Database,
  actor: AccountForAccess,
  studentId: string,
): Promise<string | null> {
  const reach = coachingChangeReachOf(actor);
  if (reach === null) return null;
  const [held] = await tx
    .select({ name: students.name })
    .from(students)
    .where(eq(students.id, studentId))
    .for("update");
  if (!held) return null;
  const latest = latestAssessments(tx);
  const [listed] = await tx
    .select({ id: students.id })
    .from(students)
    .innerJoin(latest, eq(latest.studentId, students.id))
    .where(
      and(
        eq(students.id, studentId),
        reach,
        ACTIVE_MEMBER,
        listedForCoaching(latest),
      ),
    );
  return listed ? held.name : null;
}

/**
 * The saved status of a student, or Teridentifikasi at version 0 for
 * none, held until the change ends, as a new assessment that starts it
 * again holds it too.
 */
async function currentOf(
  tx: Database,
  studentId: string,
): Promise<ShownCoachingStatus> {
  const [saved] = await tx
    .select({
      status: coachingStatuses.status,
      note: coachingStatuses.note,
      version: coachingStatuses.version,
    })
    .from(coachingStatuses)
    .where(eq(coachingStatuses.studentId, studentId))
    .for("update");
  return saved ?? { status: FIRST_COACHING_STATUS, note: "", version: 0 };
}

/** Keeps the status with the version up, the first one as a new row. */
async function keep(
  tx: Database,
  actorId: string,
  studentId: string,
  after: CoachingChange,
  version: number,
): Promise<void> {
  const changed = { ...after, changedBy: actorId, changedAt: WRITTEN_NOW };
  if (version === 1) {
    await tx.insert(coachingStatuses).values({ studentId, ...changed });
    return;
  }
  await tx
    .update(coachingStatuses)
    .set({ ...changed, version })
    .where(eq(coachingStatuses.studentId, studentId));
}

async function change(
  tx: Database,
  actor: AccountForAccess,
  studentId: string,
  shown: number,
  after: CoachingChange,
): Promise<CoachingOutcome> {
  const name = await holdStudent(tx, actor, studentId);
  if (name === null) return NOT_IN_COACHING;
  const before = await currentOf(tx, studentId);
  if (before.version !== shown)
    return { ...COACHING_OUTDATED, current: before };
  const isSame = before.status === after.status && before.note === after.note;
  if (isSame) return { ok: true, value: { name, ...before } };
  const version = before.version + 1;
  await keep(tx, actor.id, studentId, after, version);
  await tx.insert(coachingStatusChanges).values({
    studentId,
    statusBefore: before.status,
    noteBefore: before.note,
    statusAfter: after.status,
    noteAfter: after.note,
    changedBy: actor.id,
    changedAt: WRITTEN_NOW,
  });
  return { ok: true, value: { name, ...after, version } };
}

/**
 * The status choice of a row of Pembinaan karakter, with its optional
 * "Catatan": kept as the work of the actor, and logged with what it was
 * before. Refused, with nothing kept, for a role without the right to
 * change a coaching status, for what the form rules refuse, and for a
 * student outside the rows of the actor's roles with that right, not
 * Aktif, or not listed by their latest assessment. Refused too, with the
 * status as it is now, when someone changed it since the screen showed
 * `version`: the student is held, so a second change at the same moment
 * waits for the first and is refused then. A change that changes nothing
 * keeps and logs nothing.
 */
export async function changeCoachingStatus(
  db: Database,
  actor: AccountForAccess,
  studentId: string,
  version: number,
  sentStatus: string,
  sentNote: string,
): Promise<CoachingOutcome> {
  if (!may(actor.roles, "change_coaching_status")) return NOT_ALLOWED_TO_CHANGE;
  const parsed = parseCoachingChange(sentStatus, sentNote);
  if (!parsed.ok) return parsed;
  // The database refuses to compare its ids with a text of another shape.
  if (!isUuid(studentId)) return NOT_IN_COACHING;
  const after = parsed.value;
  return db.transaction((tx) => change(tx, actor, studentId, version, after));
}
