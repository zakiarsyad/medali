import { and, eq } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { dormViolationChanges, dormViolations, students } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import {
  ALREADY_UNDONE,
  OWN_REDUCTION,
  REDUCE_NOT_ALLOWED,
  REDUCED_NOT_FOUND,
} from "./reduction-messages";

/**
 * The violation, held until the transaction ends, so of two undoings at
 * the same moment the second waits for the first, then finds it undone.
 */
async function lockViolation(
  tx: Database,
  id: string,
  actor: AccountForAccess,
) {
  const visible = visibleTo(rowLimitForAction(actor, "reduce_dorm_violations"));
  const [found] = await tx
    .select({
      studentId: dormViolations.studentId,
      reducedAt: dormViolations.reducedAt,
      reductionReason: dormViolations.reductionReason,
    })
    .from(dormViolations)
    .innerJoin(students, eq(students.id, dormViolations.studentId))
    .where(and(eq(dormViolations.id, id), visible))
    .for("update", { of: dormViolations });
  return found ?? null;
}

async function undo(
  tx: Database,
  actor: AccountForAccess,
  id: string,
): Promise<Parsed<null>> {
  const found = await lockViolation(tx, id, actor);
  if (found === null) return REDUCED_NOT_FOUND;
  if (found.studentId === actor.studentId) return OWN_REDUCTION;
  if (found.reducedAt === null) return ALREADY_UNDONE;
  await tx
    .update(dormViolations)
    .set({ reducedBy: null, reducedAt: null, reductionReason: "" })
    .where(eq(dormViolations.id, id));
  await tx.insert(dormViolationChanges).values({
    violationId: id,
    changedBy: actor.id,
    changedAt: WRITTEN_NOW,
    action: "reduction_undone",
    reductionReason: found.reductionReason,
  });
  return { ok: true, value: null };
}

/**
 * "Batalkan" on a row of "Riwayat pengurangan pelanggaran": the
 * violation counts again and is back in the announcement. The mark is
 * taken away, and the log gets a line that keeps the reason undone. Any
 * Pengelola Asrama may undo a reduction another made, but never one of
 * their own student; anyone else is refused before anything is read. An
 * SP already issued stays.
 */
export async function undoReduction(
  db: Database,
  actor: AccountForAccess,
  id: unknown,
): Promise<Parsed<null>> {
  if (!may(actor.roles, "reduce_dorm_violations")) return REDUCE_NOT_ALLOWED;
  if (typeof id !== "string" || !isUuid(id)) return REDUCED_NOT_FOUND;
  return db.transaction((tx) => undo(tx, actor, id));
}
