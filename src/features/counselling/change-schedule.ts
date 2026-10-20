import { campusDay } from "@/academic-periods/campus-day";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import {
  type CounsellorMoveOutcome,
  counsellorPress,
  MOVE_NOT_ALLOWED,
  NOT_FOUND,
  type StudentMoveOutcome,
  sentVersion,
  studentPress,
} from "./move-schedule";
import { checkProposal, hasDayCome, type SentProposal } from "./schedule-rules";
import {
  CANCELLED,
  MARKED_DONE,
  MARKED_MISSED,
  NOT_HELD_YET,
  PROPOSED,
} from "./schedule-words";

/**
 * "Batalkan pendaftaran" of the student on their own Diajukan or Usulan
 * jadwal lain, and "Batalkan" on their own Dijadwalkan session: it
 * becomes Dibatalkan, and is kept. Another student's request is not
 * found. `id` and `version` come from outside and are not trusted.
 */
export async function cancelSchedule(
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
    move: "cancel" as const,
    version: sentVersion(version),
    set: {},
    now,
  };
  return studentPress(db, actor, press, CANCELLED);
}

/**
 * "Ubah jadwal" of Konselor on a Dijadwalkan session: it stays
 * Dijadwalkan at the time sent, with the message for the student and
 * them as its Konselor. Refused for a weekend or a time already passed,
 * as "Usulkan waktu lain" is. What was sent is not trusted.
 */
export async function rescheduleSchedule(
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
    move: "reschedule" as const,
    version: sentVersion(version),
    set: { ...time, counsellorId: actor.id, counsellorMessage: message },
    now,
  };
  return counsellorPress(db, actor, press, PROPOSED);
}

async function markOutcome(
  db: Database,
  actor: AccountForAccess,
  id: unknown,
  version: unknown,
  mark: { move: "mark_done" | "mark_missed"; done: string; now: Date },
): Promise<CounsellorMoveOutcome> {
  if (!may(actor.roles, "manage_counselling_schedules")) {
    return MOVE_NOT_ALLOWED;
  }
  if (!isUuid(id) || typeof id !== "string") return NOT_FOUND;
  const today = campusDay(mark.now);
  const press = {
    scheduleId: id,
    move: mark.move,
    version: sentVersion(version),
    set: {},
    refusedFor: (day: string) => (hasDayCome(day, today) ? null : NOT_HELD_YET),
    now: mark.now,
  };
  return counsellorPress(db, actor, press, mark.done);
}

/**
 * "Tandai selesai" of Konselor on a Dijadwalkan session: it becomes
 * Selesai. Refused before the day of the session.
 */
export function markScheduleDone(
  db: Database,
  actor: AccountForAccess,
  id: unknown,
  version: unknown,
  now: Date = new Date(),
): Promise<CounsellorMoveOutcome> {
  const mark = { move: "mark_done" as const, done: MARKED_DONE, now };
  return markOutcome(db, actor, id, version, mark);
}

/**
 * "Tidak hadir" of Konselor on a Dijadwalkan session: it becomes Tidak
 * hadir. Refused before the day of the session.
 */
export function markScheduleMissed(
  db: Database,
  actor: AccountForAccess,
  id: unknown,
  version: unknown,
  now: Date = new Date(),
): Promise<CounsellorMoveOutcome> {
  const mark = { move: "mark_missed" as const, done: MARKED_MISSED, now };
  return markOutcome(db, actor, id, version, mark);
}
