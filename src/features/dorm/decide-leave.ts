import { and, eq } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { dormLeaves } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import { lettersIn } from "@/ui/letters-in";
import { DECISION_NOTE_MAX_LENGTH, type LeaveStatus } from "./leave-ids";
import {
  DECIDE_NOT_ALLOWED,
  type Decided,
  LEAVE_NOT_FOUND,
  REJECTION_NEEDS_NOTE,
  tooLateToDecide,
} from "./leave-messages";

/** What "Setujui" and "Tolak" make a request. */
const DECISIONS: Record<string, LeaveStatus> = {
  approve: "approved",
  reject: "rejected",
};

export const NO_DECISION = {
  ok: false,
  error: "Pilih Setujui atau Tolak.",
} as const;

export const NOTE_TOO_LONG = {
  ok: false,
  error: `Catatan paling banyak ${DECISION_NOTE_MAX_LENGTH} huruf.`,
} as const;

/** The status a decision gives with its note, checked. */
function checked(
  decision: string,
  note: string,
): Parsed<{ status: LeaveStatus; note: string }> {
  const status = Object.hasOwn(DECISIONS, decision)
    ? DECISIONS[decision]
    : undefined;
  if (status === undefined) return NO_DECISION;
  const trimmed = note.trim();
  if (lettersIn(trimmed) > DECISION_NOTE_MAX_LENGTH) return NOTE_TOO_LONG;
  if (status === "rejected" && trimmed === "") return REJECTION_NEEDS_NOTE;
  return { ok: true, value: { status, note: trimmed } };
}

/**
 * "Setujui" and "Tolak": makes a request that waits Disetujui or Ditolak,
 * with who decided, when, and the note, which a rejection needs. A start
 * that has passed does not stop an approval. Refused for a role that may
 * not decide, BAM - BPHK among them, and for a request that no longer
 * waits. The database changes it only while it waits, so a decision and
 * a cancel at the same moment never both win: the second waits for the
 * first, then is refused.
 */
export async function decideLeave(
  db: Database,
  actor: Pick<Account, "id" | "roles">,
  id: string,
  decision: string,
  note: string,
): Promise<Decided<LeaveStatus>> {
  if (!may(actor.roles, "decide_dorm_leave")) return DECIDE_NOT_ALLOWED;
  if (!isUuid(id)) return LEAVE_NOT_FOUND;
  const sent = checked(decision, note);
  if (!sent.ok) return sent;
  const { status } = sent.value;
  const decided = await db
    .update(dormLeaves)
    .set({
      status,
      decidedBy: actor.id,
      decidedAt: WRITTEN_NOW,
      decisionNote: sent.value.note,
    })
    .where(and(eq(dormLeaves.id, id), eq(dormLeaves.status, "submitted")))
    .returning({ id: dormLeaves.id });
  if (decided.length > 0) return { ok: true, value: status };
  const [kept] = await db
    .select({ status: dormLeaves.status })
    .from(dormLeaves)
    .where(eq(dormLeaves.id, id));
  if (!kept) return LEAVE_NOT_FOUND;
  return tooLateToDecide(kept.status);
}
