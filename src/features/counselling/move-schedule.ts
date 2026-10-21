import { and, eq, type SQL } from "drizzle-orm";
import type { PgUpdateSetSource } from "drizzle-orm/pg-core";
import { campusDay } from "@/academic-periods/campus-day";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { versionOf } from "@/db/row-version";
import {
  counsellingScheduleChanges,
  counsellingSchedules,
  students,
} from "@/db/schema";
import { readScheduleCard } from "./schedule-board";
import type { ScheduleStatus } from "./schedule-ids";
import {
  checkAnotherTime,
  checkProposal,
  hasPassed,
  type ScheduleMove,
  type SentAnotherTime,
  type SentProposal,
  scheduleAfter,
} from "./schedule-rules";
import type { CounsellorScheduleCard } from "./schedule-view";
import {
  ACCEPTED,
  APPROVED,
  ASKED_ANOTHER,
  NOT_ALLOWED_WORDS,
  PROPOSAL_PASSED,
  PROPOSED,
  SCHEDULE_CHANGED_SINCE,
  SCHEDULE_NOT_FOUND,
  WISHED_TIME_PASSED,
} from "./schedule-words";

/**
 * What a press of Konselor on a request gives back. A kept change, and a
 * press refused because the request changed since the screen showed it,
 * both give the card as it is now. Any other refusal gives nothing back.
 */
export type CounsellorMoveOutcome =
  | { kind: "kept"; done: string; card: CounsellorScheduleCard }
  | { kind: "changed"; error: string; card: CounsellorScheduleCard | null }
  | { kind: "refused"; error: string };

/**
 * What a press of the student gives back. Their page is drawn again
 * after it, so it shows the request as it is now.
 */
export type StudentMoveOutcome =
  | { kind: "kept"; done: string }
  | { kind: "changed"; error: string }
  | { kind: "refused"; error: string };

export const MOVE_NOT_ALLOWED = {
  kind: "refused",
  error: NOT_ALLOWED_WORDS,
} as const;

export const NOT_FOUND = {
  kind: "refused",
  error: SCHEDULE_NOT_FOUND,
} as const;

/** What a move does in the database, before it is known to be allowed. */
export interface Press {
  actorId: string;
  scheduleId: string;
  move: ScheduleMove;
  /** The version of the request the screen showed; null when no text was sent. */
  version: string | null;
  /** What it writes on the request besides its status. */
  set: PgUpdateSetSource<typeof counsellingSchedules>;
  /** Why it is refused for the time the request holds now, if it is. */
  refusedFor?: (day: string, hour: string) => string | null;
  now: Date;
}

type MoveResult =
  | { kind: "kept" }
  | { kind: "changed" }
  | { kind: "refused"; error: string };

interface Kept {
  status: ScheduleStatus;
  /** None while an assignment waits for its time. */
  day: string | null;
  hour: string | null;
  changedAt: Date;
}

/** Why the press is refused for the time the request holds, if it is. */
function refusalFor(press: Press, current: Kept): string | null {
  const { day, hour } = current;
  if (!press.refusedFor || day === null || hour === null) return null;
  return press.refusedFor(day, hour);
}

/**
 * Locks the request, when the one who presses may act on it: `allowed`
 * names whose requests those are. One they may not act on is not found.
 */
async function lockSchedule(
  tx: Database,
  id: string,
  allowed: SQL,
): Promise<Kept | null> {
  const [kept] = await tx
    .select({
      status: counsellingSchedules.status,
      day: counsellingSchedules.day,
      hour: counsellingSchedules.hour,
      changedAt: counsellingSchedules.changedAt,
    })
    .from(counsellingSchedules)
    .innerJoin(students, eq(students.id, counsellingSchedules.studentId))
    .where(and(eq(counsellingSchedules.id, id), allowed))
    .for("update", { of: counsellingSchedules });
  return kept ?? null;
}

async function applyTo(
  tx: Database,
  press: Press,
  current: Kept,
): Promise<MoveResult> {
  const after = scheduleAfter(press.move, current.status);
  const isAsShown = versionOf(current.changedAt) === press.version;
  if (!isAsShown || after === null) return { kind: "changed" };
  const refusal = refusalFor(press, current);
  if (refusal !== null) return { kind: "refused", error: refusal };
  await tx
    .update(counsellingSchedules)
    .set({
      ...press.set,
      status: after,
      changedBy: press.actorId,
      changedAt: press.now,
    })
    .where(eq(counsellingSchedules.id, press.scheduleId));
  await tx.insert(counsellingScheduleChanges).values({
    scheduleId: press.scheduleId,
    changedBy: press.actorId,
    changedAt: press.now,
    step: press.move,
    statusBefore: current.status,
    statusAfter: after,
  });
  return { kind: "kept" };
}

/**
 * Applies a move to a request, with its log line in the same
 * transaction. The request is locked first, so of two presses at the
 * same moment the second sees what the first did. A press is refused,
 * changing nothing, when the request changed since its screen showed it
 * or the move is not allowed from the status it finds.
 */
function applyPress(
  db: Database,
  press: Press,
  allowed: SQL,
): Promise<MoveResult | null> {
  return db.transaction(async (tx) => {
    const current = await lockSchedule(tx, press.scheduleId, allowed);
    if (current === null) return null;
    return applyTo(tx, press, current);
  });
}

/** A version as sent, or null when what was sent is no text. */
export function sentVersion(version: unknown): string | null {
  return typeof version === "string" ? version : null;
}

/** The requests Konselor may act on: those of every student not removed. */
function counsellorSees(actor: AccountForAccess): SQL {
  return visibleTo(rowLimitForAction(actor, "manage_counselling_schedules"));
}

export async function counsellorPress(
  db: Database,
  actor: AccountForAccess,
  press: Omit<Press, "actorId">,
  done: string,
): Promise<CounsellorMoveOutcome> {
  const result = await applyPress(
    db,
    { ...press, actorId: actor.id },
    counsellorSees(actor),
  );
  if (result === null) return NOT_FOUND;
  if (result.kind === "refused") return result;
  const card = await readScheduleCard(db, actor, press.scheduleId);
  if (result.kind === "changed") {
    return { kind: "changed", error: SCHEDULE_CHANGED_SINCE, card };
  }
  if (card === null) throw new Error("A kept request was not found.");
  return { kind: "kept", done, card };
}

/**
 * "Setujui waktu ini" of Konselor on a Diajukan request: it becomes
 * Dijadwalkan at the time the student asked, with them as its Konselor.
 * Refused when that time has passed. `id` and `version` come from
 * outside and are not trusted.
 */
export async function approveSchedule(
  db: Database,
  actor: AccountForAccess,
  id: unknown,
  version: unknown,
  now: Date = new Date(),
): Promise<CounsellorMoveOutcome> {
  if (!may(actor.roles, "manage_counselling_schedules")) {
    return MOVE_NOT_ALLOWED;
  }
  if (!isUuid(id) || typeof id !== "string") return NOT_FOUND;
  const press = {
    scheduleId: id,
    move: "approve" as const,
    version: sentVersion(version),
    set: { counsellorId: actor.id, counsellorMessage: null },
    refusedFor: (day: string, hour: string) =>
      hasPassed(day, hour, now) ? WISHED_TIME_PASSED : null,
    now,
  };
  return counsellorPress(db, actor, press, APPROVED);
}

/**
 * "Usulkan waktu lain" of Konselor on a Diajukan request: it becomes
 * Usulan jadwal lain at the time sent, with the message for the student.
 * Refused for a weekend or a time already passed. What was sent is not
 * trusted.
 */
export async function proposeSchedule(
  db: Database,
  actor: AccountForAccess,
  id: unknown,
  version: unknown,
  sent: SentProposal,
  now: Date = new Date(),
): Promise<CounsellorMoveOutcome> {
  if (!may(actor.roles, "manage_counselling_schedules")) {
    return MOVE_NOT_ALLOWED;
  }
  if (!isUuid(id) || typeof id !== "string") return NOT_FOUND;
  const checked = checkProposal(sent, now);
  if (!checked.ok) return { kind: "refused", error: checked.error };
  const { message, ...time } = checked.value;
  const press = {
    scheduleId: id,
    move: "propose" as const,
    version: sentVersion(version),
    set: { ...time, counsellorId: actor.id, counsellorMessage: message },
    now,
  };
  return counsellorPress(db, actor, press, PROPOSED);
}

/** The requests a student may answer: their own only. */
function ownOf(studentId: string): SQL {
  return eq(counsellingSchedules.studentId, studentId);
}

export async function studentPress(
  db: Database,
  actor: AccountForAccess,
  press: Omit<Press, "actorId">,
  done: string,
): Promise<StudentMoveOutcome> {
  if (actor.studentId === null) return MOVE_NOT_ALLOWED;
  const result = await applyPress(
    db,
    { ...press, actorId: actor.id },
    ownOf(actor.studentId),
  );
  if (result === null) return NOT_FOUND;
  if (result.kind === "changed") {
    return { kind: "changed", error: SCHEDULE_CHANGED_SINCE };
  }
  if (result.kind === "refused") return result;
  return { kind: "kept", done };
}

/**
 * "Terima jadwal ini" of the student on their own Usulan jadwal lain: it
 * becomes Dijadwalkan at the time Konselor proposed. Refused when that
 * time has passed. Another student's request is not found.
 */
export async function acceptSchedule(
  db: Database,
  actor: AccountForAccess,
  id: unknown,
  version: unknown,
  now: Date = new Date(),
): Promise<StudentMoveOutcome> {
  if (!may(actor.roles, "register_own_counselling")) return MOVE_NOT_ALLOWED;
  if (!isUuid(id) || typeof id !== "string") return NOT_FOUND;
  const press = {
    scheduleId: id,
    move: "accept" as const,
    version: sentVersion(version),
    set: {},
    refusedFor: (day: string, hour: string) =>
      hasPassed(day, hour, now) ? PROPOSAL_PASSED : null,
    now,
  };
  return studentPress(db, actor, press, ACCEPTED);
}

/**
 * "Minta waktu lain" of the student on their own Usulan jadwal lain, and
 * "Minta jadwal ulang" on their own Dijadwalkan session: it goes back to
 * Diajukan at the time sent, with the Alasan for Konselor, and the way of
 * meeting kept. Another student's request is not found. What was sent is
 * not trusted.
 */
export async function askAnotherTime(
  db: Database,
  actor: AccountForAccess,
  id: unknown,
  version: unknown,
  sent: SentAnotherTime,
  now: Date = new Date(),
): Promise<StudentMoveOutcome> {
  if (!may(actor.roles, "register_own_counselling")) return MOVE_NOT_ALLOWED;
  if (!isUuid(id) || typeof id !== "string") return NOT_FOUND;
  const checked = checkAnotherTime(sent, campusDay(now));
  if (!checked.ok) return { kind: "refused", error: checked.error };
  const press = {
    scheduleId: id,
    move: "ask_another" as const,
    version: sentVersion(version),
    set: checked.value,
    now,
  };
  return studentPress(db, actor, press, ASKED_ANOTHER);
}
