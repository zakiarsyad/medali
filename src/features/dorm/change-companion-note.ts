import { and, eq, isNull } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { dormCompanions, students } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { COMPANION_NOT_FOUND } from "./companion-duty";
import { COMPANIONS_NOT_ALLOWED } from "./companion-messages";
import { parseCompanionNote } from "./companion-note";

/** The new Keterangan of a kakak pendamping, as the form sends it. */
export interface SentNote {
  studentId: string;
  note: string;
}

/**
 * The kakak pendamping of this student, while the student is not removed:
 * the list no longer shows one whose student was removed.
 */
function listedCompanion(studentId: string) {
  return and(
    eq(dormCompanions.studentId, studentId),
    eq(students.id, dormCompanions.studentId),
    isNull(students.deletedAt),
  );
}

/**
 * Gives a kakak pendamping a new Keterangan, Aktif or Tidak aktif. An
 * empty one is kept as none. Only the Keterangan changes.
 */
export async function changeCompanionNote(
  db: Database,
  actor: Pick<Account, "roles">,
  sent: SentNote,
): Promise<Parsed<string>> {
  if (!may(actor.roles, "manage_dorm_companions")) {
    return COMPANIONS_NOT_ALLOWED;
  }
  const note = parseCompanionNote(sent.note);
  if (!note.ok) return note;
  if (!isUuid(sent.studentId)) return COMPANION_NOT_FOUND;
  const changed = await db
    .update(dormCompanions)
    .set({ note: note.value })
    .from(students)
    .where(listedCompanion(sent.studentId))
    .returning({ studentId: dormCompanions.studentId });
  if (changed.length === 0) return COMPANION_NOT_FOUND;
  return { ok: true, value: "Keterangan kakak pendamping diubah." };
}
