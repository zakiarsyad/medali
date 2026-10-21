import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import {
  type CounsellorMoveOutcome,
  counsellorPress,
  MOVE_NOT_ALLOWED,
  NOT_FOUND,
  sentVersion,
} from "./move-schedule";
import { checkProposal, type SentProposal } from "./schedule-rules";
import { TIME_SET } from "./schedule-words";

/**
 * "Tetapkan jadwal" of Konselor on an assignment that is Menunggu jadwal
 * or Minta jadwal ulang: it becomes Dijadwalkan at once at the time
 * sent, with the message for the student and them as its Konselor.
 * Refused for a weekend or a time already passed, and for a voluntary
 * request. What was sent is not trusted.
 */
export async function setScheduleTime(
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
    move: "set_time" as const,
    version: sentVersion(version),
    set: { ...time, counsellorId: actor.id, counsellorMessage: message },
    now,
  };
  return counsellorPress(db, actor, press, TIME_SET);
}
