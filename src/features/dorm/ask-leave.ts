import { eq } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { dormLeaves } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { type LeaveInput, parseLeave, type SentLeave } from "./leave-input";
import {
  ASK_NOT_ALLOWED,
  LEAVE_ALREADY_SENT,
  LEAVE_OVERLAPS,
  NOT_A_RESIDENT,
} from "./leave-messages";
import { lockStudent, overlapsOwn } from "./leave-store";
import { readStudentDorm } from "./student-dorm";

type StoredLeave = typeof dormLeaves.$inferSelect;

/**
 * Whether the request kept under a key is the one this form added
 * before: of the same student, with every part the same. A form whose
 * parts were changed after it was sent is not the same form: taking it
 * for one would drop the change while saying it was saved.
 */
function isSameRequest(
  kept: StoredLeave,
  studentId: string,
  input: LeaveInput,
): boolean {
  return (
    kept.studentId === studentId &&
    kept.kind === input.kind &&
    kept.startsAt.getTime() === input.start.getTime() &&
    kept.endsAt.getTime() === input.end.getTime() &&
    kept.specialReason === input.specialReason &&
    kept.purpose === input.purpose &&
    kept.destination === input.destination &&
    kept.contact === input.contact
  );
}

async function save(
  tx: Database,
  studentId: string,
  id: string,
  input: LeaveInput,
  moment: Date,
): Promise<Parsed<LeaveInput>> {
  await lockStudent(tx, studentId);
  const saved = { ok: true, value: input } as const;
  const [kept] = await tx
    .select()
    .from(dormLeaves)
    .where(eq(dormLeaves.id, id));
  if (kept) {
    return isSameRequest(kept, studentId, input) ? saved : LEAVE_ALREADY_SENT;
  }
  if (await overlapsOwn(tx, studentId, input)) return LEAVE_OVERLAPS;
  await tx.insert(dormLeaves).values({
    id,
    studentId,
    kind: input.kind,
    startsAt: input.start,
    endsAt: input.end,
    specialReason: input.specialReason,
    purpose: input.purpose,
    destination: input.destination,
    contact: input.contact,
    sentAt: moment,
  });
  return saved;
}

/**
 * "Ajukan izin": keeps a leave request of the actor's own student, as
 * Diajukan. Refused for a role that may not ask, for a student who lives
 * in no dorm today, for times or words the rules refuse, and for times
 * that overlap another request of theirs that waits or is approved. `id`
 * is the key its form made. A form sent twice is kept once: the second
 * waits for the first, then adds nothing, and its answer is the same as
 * the first. Two requests of one student at once are taken one after the
 * other, so two that overlap are never both kept.
 */
export async function askLeave(
  db: Database,
  actor: Pick<Account, "roles" | "studentId">,
  id: string,
  sent: SentLeave,
  moment: Date = new Date(),
): Promise<Parsed<LeaveInput>> {
  if (!may(actor.roles, "ask_dorm_leave")) return ASK_NOT_ALLOWED;
  const { studentId } = actor;
  if (studentId === null) return NOT_A_RESIDENT;
  const parsed = parseLeave(sent, moment);
  if (!parsed.ok) return parsed;
  if (!isUuid(id)) return LEAVE_ALREADY_SENT;
  const dorm = await readStudentDorm(db, studentId, campusDay(moment));
  if (dorm === null) return NOT_A_RESIDENT;
  return db.transaction((tx) => save(tx, studentId, id, parsed.value, moment));
}
