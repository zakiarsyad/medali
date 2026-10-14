import { and, desc, eq } from "drizzle-orm";
import { type AccountForAccess, may } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { sikuAdjustmentStudents, sikuAdjustments } from "@/db/schema";
import type { SikuKind, SikuReason } from "./siku-ids";
import type { SikuTotals } from "./siku-score";
import { IN_FORCE } from "./siku-totals";

/**
 * One gain or loss of a student's own SIKU. It names the role that
 * entered it, never the staff member.
 */
export interface OwnEntry {
  id: string;
  day: string;
  kind: SikuKind;
  reason: SikuReason;
  points: number;
  note: string;
  basis: string;
  enteredAs: RoleId;
}

export interface OwnSiku {
  totals: SikuTotals;
  /** The entries in force, the latest day first. */
  entries: OwnEntry[];
}

export type OwnSikuAnswer =
  | { kind: "refused" }
  | { kind: "shown"; siku: OwnSiku };

function totalsOf(entries: readonly OwnEntry[]): SikuTotals {
  const totals = { gains: 0, losses: 0 };
  for (const entry of entries) {
    if (entry.kind === "gain") totals.gains += entry.points;
    if (entry.kind === "loss") totals.losses += entry.points;
  }
  return totals;
}

/**
 * The SIKU of the account's own student: every entry in force that names
 * them, of every period. Whose SIKU it is comes from the account, never
 * from what was asked, so a student reads no one else's. Refused for an
 * account without the right, or with no student.
 */
export async function readOwnSiku(
  db: Database,
  account: Pick<AccountForAccess, "roles" | "studentId">,
): Promise<OwnSikuAnswer> {
  if (!may(account.roles, "view_own_siku")) return { kind: "refused" };
  const { studentId } = account;
  if (studentId === null) return { kind: "refused" };
  const entries = await db
    .select({
      id: sikuAdjustments.id,
      day: sikuAdjustments.day,
      kind: sikuAdjustments.kind,
      reason: sikuAdjustments.reason,
      points: sikuAdjustments.points,
      note: sikuAdjustments.note,
      basis: sikuAdjustments.basis,
      enteredAs: sikuAdjustments.enteredAs,
    })
    .from(sikuAdjustmentStudents)
    .innerJoin(
      sikuAdjustments,
      eq(sikuAdjustments.id, sikuAdjustmentStudents.adjustmentId),
    )
    .where(and(eq(sikuAdjustmentStudents.studentId, studentId), IN_FORCE))
    .orderBy(desc(sikuAdjustments.day), desc(sikuAdjustments.enteredAt));
  return { kind: "shown", siku: { totals: totalsOf(entries), entries } };
}
