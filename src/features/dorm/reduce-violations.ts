import { and, eq, inArray, type SQL } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import {
  dormViolationAppeals,
  dormViolationChanges,
  dormViolations,
  students,
} from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import {
  ALREADY_REDUCED,
  NONE_PICKED,
  NOT_ESCALATED,
  OWN_REDUCTION,
  REDUCE_NOT_ALLOWED,
  REDUCED_NOT_FOUND,
  TOO_MANY_PICKED,
} from "./reduction-messages";
import {
  keptReductionReason,
  reductionReasonFault,
  reductionStanding,
} from "./reduction-rules";
import type { CallAfter } from "./reduction-words";
import { APPEAL_OF_VIOLATION } from "./violation-announcement";
import { REDUCTIONS_PER_SEND_MAX } from "./violation-ids";
import { readStandingOf, readWarningSemester } from "./warning-standing";

/** A reduction as the form sends it: nothing in it is trusted. */
export interface SentReduction {
  studentId: unknown;
  violationIds: unknown;
  reason: unknown;
}

/** One violation as the box of a student sends it: nothing in it is trusted. */
export interface SentOneReduction {
  studentId: unknown;
  violationId: unknown;
  reason: unknown;
}

interface CheckedReduction {
  studentId: string;
  violationIds: string[];
  reason: string;
}

/** What a reduction did. */
export interface Reduced {
  /** The days of the violations reduced, the earliest first. */
  days: string[];
  /** Where the resident stands toward an SP after it, or null while no period is stored. */
  standing: CallAfter | null;
}

function pickedIds(sent: unknown): Parsed<string[]> {
  if (!Array.isArray(sent) || sent.length === 0) return NONE_PICKED;
  if (sent.length > REDUCTIONS_PER_SEND_MAX) return TOO_MANY_PICKED;
  const ids = new Set<string>();
  for (const id of sent) {
    if (typeof id !== "string" || !isUuid(id)) return REDUCED_NOT_FOUND;
    ids.add(id.toLowerCase());
  }
  return { ok: true, value: [...ids] };
}

function checked(
  sent: SentReduction,
  actor: AccountForAccess,
): Parsed<CheckedReduction> {
  const { reason } = sent;
  if (typeof sent.studentId !== "string" || !isUuid(sent.studentId)) {
    return REDUCED_NOT_FOUND;
  }
  // The database reads a key in capitals as the same student, so the
  // comparison with the account's own student must ignore case too.
  const studentId = sent.studentId.toLowerCase();
  if (studentId === actor.studentId?.toLowerCase()) return OWN_REDUCTION;
  const ids = pickedIds(sent.violationIds);
  if (!ids.ok) return ids;
  const text = typeof reason === "string" ? reason : "";
  const fault = reductionReasonFault(text);
  if (fault !== null) return { ok: false, error: fault };
  return {
    ok: true,
    value: {
      studentId,
      violationIds: ids.value,
      reason: keptReductionReason(text),
    },
  };
}

/**
 * The picked violations of the student, held until the transaction ends,
 * so of two reductions at the same moment the second waits for the
 * first, then finds them reduced.
 */
function lockPicked(tx: Database, picked: CheckedReduction, visible: SQL) {
  return tx
    .select({
      id: dormViolations.id,
      day: dormViolations.day,
      announcedAt: dormViolations.announcedAt,
      cancelledAt: dormViolations.cancelledAt,
      reducedAt: dormViolations.reducedAt,
      appeal: dormViolationAppeals.status,
    })
    .from(dormViolations)
    .innerJoin(students, eq(students.id, dormViolations.studentId))
    .leftJoin(dormViolationAppeals, APPEAL_OF_VIOLATION)
    .where(
      and(
        inArray(dormViolations.id, picked.violationIds),
        eq(dormViolations.studentId, picked.studentId),
        visible,
      ),
    )
    .for("update", { of: dormViolations });
}

/**
 * Marks every picked violation reduced, with a line in the log for each,
 * or none of them: one that is not there, reduced already, or not gone
 * up to Pengelola Asrama refuses them all.
 */
async function reduce(
  tx: Database,
  actorId: string,
  picked: CheckedReduction,
  visible: SQL,
  now: Date,
): Promise<Parsed<string[]>> {
  const found = await lockPicked(tx, picked, visible);
  if (found.length !== picked.violationIds.length) return REDUCED_NOT_FOUND;
  const standings = found.map((each) => reductionStanding(each, now));
  if (standings.includes("reduced")) return ALREADY_REDUCED;
  if (standings.includes("not_escalated")) return NOT_ESCALATED;
  await tx
    .update(dormViolations)
    .set({ reducedBy: actorId, reducedAt: now, reductionReason: picked.reason })
    .where(inArray(dormViolations.id, picked.violationIds));
  await tx.insert(dormViolationChanges).values(
    picked.violationIds.map((violationId) => ({
      violationId,
      changedBy: actorId,
      changedAt: WRITTEN_NOW,
      action: "reduced" as const,
      reductionReason: picked.reason,
    })),
  );
  return { ok: true, value: found.map((each) => each.day).sort() };
}

/** Where a student stands toward an SP in the running semester, or null while no period is stored. */
async function standingAfter(
  db: Database,
  visible: SQL,
  studentId: string,
  now: Date,
): Promise<CallAfter | null> {
  const semester = await readWarningSemester(db, now);
  if (semester === null) return null;
  const found = await readStandingOf(db, semester, visible, studentId, now);
  if (found === null) return null;
  return { counted: found.counted, level: found.level };
}

/**
 * "Kurangi": the picked violations of one student, each gone up to
 * Pengelola Asrama, stop counting and leave the announcement. Each is
 * marked with Dasar pengurangan, who and when, never erased, and the log
 * gets a line for each. Pengelola Asrama alone reduces, never for the
 * student their account belongs to; anyone else is refused before
 * anything is read. All of them are reduced, or none. What was sent
 * comes from outside and is not trusted; `now` is the moment on the
 * server's clock.
 */
export async function reduceViolations(
  db: Database,
  actor: AccountForAccess,
  sent: SentReduction,
  now: Date,
): Promise<Parsed<Reduced>> {
  if (!may(actor.roles, "reduce_dorm_violations")) return REDUCE_NOT_ALLOWED;
  const picked = checked(sent, actor);
  if (!picked.ok) return picked;
  const visible = visibleTo(rowLimitForAction(actor, "reduce_dorm_violations"));
  const days = await db.transaction((tx) =>
    reduce(tx, actor.id, picked.value, visible, now),
  );
  if (!days.ok) return days;
  const standing = await standingAfter(
    db,
    visible,
    picked.value.studentId,
    now,
  );
  return { ok: true, value: { days: days.value, standing } };
}
