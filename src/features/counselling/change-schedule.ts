import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import {
  MOVE_NOT_ALLOWED,
  NOT_FOUND,
  type StudentMoveOutcome,
  sentVersion,
  studentPress,
} from "./move-schedule";
import { CANCELLED } from "./schedule-words";

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
