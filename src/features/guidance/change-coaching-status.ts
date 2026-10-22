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
import type { Parsed } from "@/parsed";
import { type CoachingChange, parseCoachingChange } from "./coaching-change";
import { NOT_ALLOWED_TO_CHANGE, NOT_IN_COACHING } from "./coaching-messages";
import { coachingChangeReachOf } from "./coaching-reach";

/** A student's status as it stands after a change, with whose it is. */
export interface KeptCoachingStatus extends CoachingChange {
  name: string;
  /** 0 while no status is saved. */
  version: number;
}

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

/** The saved status of a student, or Teridentifikasi at version 0 for none. */
async function currentOf(tx: Database, studentId: string) {
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
  after: CoachingChange,
): Promise<Parsed<KeptCoachingStatus>> {
  const name = await holdStudent(tx, actor, studentId);
  if (name === null) return NOT_IN_COACHING;
  const before = await currentOf(tx, studentId);
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
 * Aktif, or not listed by their latest assessment. A change that changes
 * nothing keeps and logs nothing.
 */
export async function changeCoachingStatus(
  db: Database,
  actor: AccountForAccess,
  studentId: string,
  sentStatus: string,
  sentNote: string,
): Promise<Parsed<KeptCoachingStatus>> {
  if (!may(actor.roles, "change_coaching_status")) return NOT_ALLOWED_TO_CHANGE;
  const parsed = parseCoachingChange(sentStatus, sentNote);
  if (!parsed.ok) return parsed;
  // The database refuses to compare its ids with a text of another shape.
  if (!isUuid(studentId)) return NOT_IN_COACHING;
  const after = parsed.value;
  return db.transaction((tx) => change(tx, actor, studentId, after));
}
