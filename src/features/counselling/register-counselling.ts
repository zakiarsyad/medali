import { and, eq, inArray } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import {
  counsellingScheduleChanges,
  counsellingSchedules,
  students,
} from "@/db/schema";
import { ACTIVE_STATUSES } from "@/mental-health/schedule-ids";
import { consentByRegistration } from "./change-consent";
import {
  type CheckedRegistration,
  checkRegistration,
  type SentRegistration,
} from "./schedule-rules";
import { NOT_ALLOWED_WORDS, REGISTERED, STILL_ACTIVE } from "./schedule-words";

/** What "Daftar konseling" gives back: nothing is saved on a refusal. */
export type RegisterOutcome =
  | { kind: "kept"; done: string }
  | { kind: "refused"; error: string };

export const REGISTER_NOT_ALLOWED = {
  kind: "refused",
  error: NOT_ALLOWED_WORDS,
} as const;

/**
 * Locks the student, so of two registrations, or two calls, at the same
 * moment the second waits until the first is kept and then finds it.
 */
export async function lockStudent(
  tx: Database,
  studentId: string,
): Promise<boolean> {
  const [found] = await tx
    .select({ id: students.id })
    .from(students)
    .where(eq(students.id, studentId))
    .for("no key update");
  return found !== undefined;
}

async function hasActiveVoluntary(
  tx: Database,
  studentId: string,
): Promise<boolean> {
  const [found] = await tx
    .select({ id: counsellingSchedules.id })
    .from(counsellingSchedules)
    .where(
      and(
        eq(counsellingSchedules.studentId, studentId),
        eq(counsellingSchedules.kind, "voluntary"),
        inArray(counsellingSchedules.status, [...ACTIVE_STATUSES]),
      ),
    );
  return found !== undefined;
}

async function addRequest(
  tx: Database,
  actorId: string,
  studentId: string,
  checked: CheckedRegistration,
  now: Date,
): Promise<void> {
  const [added] = await tx
    .insert(counsellingSchedules)
    .values({
      studentId,
      kind: "voluntary",
      status: "submitted",
      ...checked,
      createdAt: now,
      changedBy: actorId,
      changedAt: now,
    })
    .returning({ id: counsellingSchedules.id });
  if (!added) throw new Error("The request was not added.");
  await tx.insert(counsellingScheduleChanges).values({
    scheduleId: added.id,
    changedBy: actorId,
    changedAt: now,
    step: "register",
    statusBefore: null,
    statusAfter: "submitted",
  });
}

/**
 * "Daftar konseling" of the signed-in student, for themselves only: the
 * request with its log line, and their consent made Disetujui when it
 * was not, all or nothing. Refused, saving nothing, for a day before
 * tomorrow or on a weekend, without the tick, or while a voluntary
 * request of theirs is still active. Refused for any role without the
 * right. What was sent is not trusted.
 */
export async function registerCounselling(
  db: Database,
  actor: AccountForAccess,
  sent: SentRegistration,
  now: Date = new Date(),
): Promise<RegisterOutcome> {
  if (!may(actor.roles, "register_own_counselling"))
    return REGISTER_NOT_ALLOWED;
  const { studentId } = actor;
  if (studentId === null) return REGISTER_NOT_ALLOWED;
  const checked = checkRegistration(sent, campusDay(now));
  if (!checked.ok) return { kind: "refused", error: checked.error };
  return db.transaction(async (tx) => {
    if (!(await lockStudent(tx, studentId))) return REGISTER_NOT_ALLOWED;
    if (await hasActiveVoluntary(tx, studentId)) {
      return { kind: "refused", error: STILL_ACTIVE };
    }
    await addRequest(tx, actor.id, studentId, checked.value, now);
    await consentByRegistration(tx, actor.id, studentId, now);
    return { kind: "kept", done: REGISTERED };
  });
}
