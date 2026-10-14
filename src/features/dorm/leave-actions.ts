"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { text } from "@/ui/form-data";
import type { FormState } from "@/ui/form-message";
import { askLeave } from "./ask-leave";
import { cancelLeave } from "./cancel-leave";
import { decideLeave } from "./decide-leave";
import { describeLeave } from "./describe-leave";
import { LEAVE_ADDRESS } from "./leave-address";
import type { SentLeave } from "./leave-input";
import type { LeaveNote } from "./leave-note";
import { KIND_WORDS } from "./leave-words";

/**
 * The signed-in account when it may ask for leave. Any other is refused
 * before anything of what it sent is read.
 */
async function resident(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "ask_dorm_leave")) forbidden();
  return account;
}

/** The signed-in account when it may approve and reject leave. */
async function decider(): Promise<Account> {
  const account = await currentAccount();
  if (!account || !may(account.roles, "decide_dorm_leave")) forbidden();
  return account;
}

function sentLeave(form: FormData): SentLeave {
  return {
    kind: text(form, "kind"),
    startsAt: text(form, "startsAt"),
    endsAt: text(form, "endsAt"),
    specialReason: text(form, "specialReason"),
    purpose: text(form, "purpose"),
    destination: text(form, "destination"),
    contact: text(form, "contact"),
  };
}

/** "Ajukan izin". Whose leave it is comes from the account, never a field. */
export async function askLeaveAction(
  _before: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await resident();
  const id = text(form, "id");
  const saved = await askLeave(database(), actor, id, sentLeave(form));
  if (!saved.ok) return { error: saved.error, done: null };
  revalidatePath(LEAVE_ADDRESS);
  const kind = KIND_WORDS[saved.value.kind];
  return {
    error: null,
    done: `${kind} diajukan. Menunggu verifikasi Pengelola Asrama.`,
  };
}

/** "Batalkan" on a request of the account's own student. */
export async function cancelLeaveAction(id: string): Promise<FormState> {
  const actor = await resident();
  const cancelled = await cancelLeave(database(), actor, String(id));
  // A refusal stays beside its button, which a reload would take away.
  if (!cancelled.ok) return { error: cancelled.error, done: null };
  revalidatePath(LEAVE_ADDRESS);
  return { error: null, done: "Pengajuan dibatalkan." };
}

const DECIDED_WORDS: Record<string, string> = {
  approved: "Izin disetujui.",
  rejected: "Izin ditolak.",
};

/**
 * "Setujui" and "Tolak" on a card. Who decided is the signed-in account,
 * never a field. A refusal stays on its card, which a reload would take
 * away.
 */
export async function decideLeaveAction(
  id: string,
  decision: string,
  note: string,
): Promise<FormState> {
  const actor = await decider();
  const decided = await decideLeave(
    database(),
    actor,
    String(id),
    String(decision),
    String(note),
  );
  if (!decided.ok) return { error: decided.error, done: null };
  revalidatePath(LEAVE_ADDRESS);
  return { error: null, done: DECIDED_WORDS[decided.value] ?? null };
}

/** The note under the times of the form, while they are typed. */
export async function describeLeaveAction(
  kind: string,
  startsAt: string,
  endsAt: string,
): Promise<LeaveNote | null> {
  const actor = await resident();
  return describeLeave(database(), actor, {
    kind: String(kind),
    startsAt: String(startsAt),
    endsAt: String(endsAt),
  });
}
