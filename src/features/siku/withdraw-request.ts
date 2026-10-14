import { and, eq } from "drizzle-orm";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { sikuRequests } from "@/db/schema";
import type { Parsed } from "@/parsed";
import {
  ALREADY_DECIDED,
  ASK_NOT_ALLOWED,
  REQUEST_NOT_FOUND,
  REQUEST_WITHDRAWN,
} from "./request-messages";

async function withdraw(
  tx: Database,
  studentId: string,
  id: string,
  at: Date,
): Promise<Parsed<string>> {
  // A decision at the same moment waits here for the withdrawal to end,
  // or the withdrawal waits for it, and the second finds it changed.
  const [held] = await tx
    .select({ status: sikuRequests.status })
    .from(sikuRequests)
    .where(and(eq(sikuRequests.id, id), eq(sikuRequests.studentId, studentId)))
    .for("update");
  if (!held || held.status === "withdrawn") return REQUEST_NOT_FOUND;
  if (held.status !== "waiting") return ALREADY_DECIDED;
  await tx
    .update(sikuRequests)
    .set({ status: "withdrawn", withdrawnAt: at })
    .where(eq(sikuRequests.id, id));
  return { ok: true, value: REQUEST_WITHDRAWN };
}

/**
 * "Tarik pengajuan": a request of the account's own student that still
 * waits is marked withdrawn, with when, never erased, and is shown to
 * nobody after. A request of another student answers as one that does
 * not exist; one decided before, or at the same moment, is refused.
 * `at` is the moment on the server's clock.
 */
export async function withdrawSikuRequest(
  db: Database,
  actor: Pick<AccountForAccess, "roles" | "studentId">,
  id: string,
  at: Date,
): Promise<Parsed<string>> {
  if (!may(actor.roles, "ask_siku_addition")) return ASK_NOT_ALLOWED;
  const { studentId } = actor;
  if (studentId === null) return ASK_NOT_ALLOWED;
  if (!isUuid(id)) return REQUEST_NOT_FOUND;
  return db.transaction((tx) => withdraw(tx, studentId, id, at));
}
