import { and, eq, isNull } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import {
  accounts,
  mentorEvaluationChanges,
  mentorEvaluations,
  mentorGroupMentors,
  mentorGroups,
} from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import { EVALUATION_ASPECTS } from "./evaluation-aspects";
import type { EvaluationInput } from "./evaluation-input";
import { evaluationPeriods, heldDuring } from "./evaluation-periods";
import { type EvaluationResult, evaluationResult } from "./evaluation-result";
import { evaluatedRowsFor } from "./visible-evaluations";
import { maySeeGroup, NOT_ENDED } from "./visible-groups";

/** What a save answers to any role but Kepala Unit. */
export const NOT_ALLOWED_TO_EVALUATE = {
  ok: false,
  error: "Anda tidak berhak mengevaluasi pengasuh.",
} as const;

export const GROUP_NOT_FOUND = {
  ok: false,
  error:
    "Kelompok pengasuhan ini tidak ditemukan. Muat ulang halaman, lalu pilih kelompok lagi.",
} as const;

export const GROUP_WITHOUT_MENTOR = {
  ok: false,
  error:
    "Kelompok ini belum memiliki pengasuh, sehingga belum ada yang dievaluasi.",
} as const;

export const PERIOD_NOT_OFFERED = {
  ok: false,
  error:
    "Periode ini tidak dapat dipilih. Pilih periode berjalan atau periode sebelumnya.",
} as const;

/** What a save is told for a period that ended before the mentor took the group. */
export const NOT_HELD_THEN = {
  ok: false,
  error:
    "Pengasuh kelompok ini belum mengasuh pada periode tersebut, sehingga tidak dapat dievaluasi untuk periode itu. Pilih periode sejak pengasuh ini mulai mengasuh.",
} as const;

/** What a correction is told when the group has another mentor by now. */
export const OF_EARLIER_MENTOR = {
  ok: false,
  error:
    "Evaluasi kelompok ini pada periode tersebut sudah tercatat untuk pengasuh sebelumnya. Pilih periode lain.",
} as const;

/** What "Simpan evaluasi" tells the one who saved. */
export interface SavedEvaluation {
  mentorName: string;
  result: EvaluationResult;
}

type StoredEvaluation = typeof mentorEvaluations.$inferSelect;

/**
 * Reads a group that is in force and holds it until the transaction ends,
 * so two saves for one group never run at the same moment: the second
 * waits, and then sees what the first one saved. Held without its key, so
 * nothing that only names the group has to wait.
 */
async function lockGroup(tx: Database, groupId: string) {
  const [group] = await tx
    .select({
      id: mentorGroups.id,
      studyProgramId: mentorGroups.studyProgramId,
    })
    .from(mentorGroups)
    .where(and(eq(mentorGroups.id, groupId), NOT_ENDED))
    .for("no key update");
  return group ?? null;
}

async function readMentorOfToday(tx: Database, groupId: string) {
  const [mentor] = await tx
    .select({
      id: accounts.id,
      name: accounts.name,
      since: mentorGroupMentors.startsOn,
    })
    .from(mentorGroupMentors)
    .innerJoin(accounts, eq(accounts.id, mentorGroupMentors.mentorId))
    .where(
      and(
        eq(mentorGroupMentors.groupId, groupId),
        isNull(mentorGroupMentors.endsOn),
      ),
    );
  return mentor ?? null;
}

/** The period named when it is offered on a day. Null when it is not. */
async function findOffered(tx: Database, periodId: string, day: string) {
  const offered = evaluationPeriods(await readAcademicPeriods(tx), day);
  return offered.find((period) => period.id === periodId) ?? null;
}

async function findEvaluation(
  tx: Database,
  input: EvaluationInput,
): Promise<StoredEvaluation | null> {
  const [stored] = await tx
    .select()
    .from(mentorEvaluations)
    .where(
      and(
        eq(mentorEvaluations.groupId, input.groupId),
        eq(mentorEvaluations.periodId, input.periodId),
      ),
    );
  return stored ?? null;
}

function isUnchanged(stored: StoredEvaluation, input: EvaluationInput) {
  const sameScores = EVALUATION_ASPECTS.every(
    (aspect) => stored[aspect] === input.scores[aspect],
  );
  return sameScores && stored.note === input.note;
}

/** Adds to the log who saved, with the values before, if any, and after. */
async function addLogLine(
  tx: Database,
  evaluationId: string,
  changedBy: string,
  input: EvaluationInput,
  before: StoredEvaluation | null,
): Promise<void> {
  await tx.insert(mentorEvaluationChanges).values({
    evaluationId,
    changedBy,
    changedAt: WRITTEN_NOW,
    activityBefore: before?.activity ?? null,
    attendanceBefore: before?.attendance ?? null,
    achievementBefore: before?.achievement ?? null,
    feedbackBefore: before?.feedback ?? null,
    noteBefore: before?.note ?? null,
    activityAfter: input.scores.activity,
    attendanceAfter: input.scores.attendance,
    achievementAfter: input.scores.achievement,
    feedbackAfter: input.scores.feedback,
    noteAfter: input.note,
  });
}

async function addEvaluation(
  tx: Database,
  actorId: string,
  mentorId: string,
  input: EvaluationInput,
): Promise<void> {
  const [added] = await tx
    .insert(mentorEvaluations)
    .values({
      groupId: input.groupId,
      mentorId,
      periodId: input.periodId,
      ...input.scores,
      note: input.note,
      evaluatedBy: actorId,
      evaluatedAt: WRITTEN_NOW,
    })
    .returning({ id: mentorEvaluations.id });
  if (!added) throw new Error("The evaluation was not added.");
  await addLogLine(tx, added.id, actorId, input, null);
}

/** A save that changes nothing writes nothing: no new moment, no log line. */
async function correctEvaluation(
  tx: Database,
  actorId: string,
  stored: StoredEvaluation,
  input: EvaluationInput,
): Promise<void> {
  if (isUnchanged(stored, input)) return;
  await tx
    .update(mentorEvaluations)
    .set({
      ...input.scores,
      note: input.note,
      evaluatedBy: actorId,
      evaluatedAt: WRITTEN_NOW,
    })
    .where(eq(mentorEvaluations.id, stored.id));
  await addLogLine(tx, stored.id, actorId, input, stored);
}

function saved(
  mentorName: string,
  input: EvaluationInput,
): Parsed<SavedEvaluation> {
  return {
    ok: true,
    value: { mentorName, result: evaluationResult(input.scores) },
  };
}

/**
 * "Simpan evaluasi": keeps the evaluation of the mentor who holds a group
 * today, for the running period or the one before, as the work of the
 * actor. The first save for a group and period adds it; a later one
 * corrects it. Each adds a line to the log with the values before and
 * after. Refused for any role but Kepala Unit, for a group that is ended
 * or has no mentor, for a period that is not offered on `day`, and for a
 * period that ended before the mentor took the group.
 */
export async function saveEvaluation(
  db: Database,
  actor: AccountForAccess,
  input: EvaluationInput,
  day: string = campusDay(),
): Promise<Parsed<SavedEvaluation>> {
  const limit = evaluatedRowsFor(actor);
  if (limit === null) return NOT_ALLOWED_TO_EVALUATE;

  return db.transaction(async (tx) => {
    const group = await lockGroup(tx, input.groupId);
    if (!group || !maySeeGroup(limit, group.studyProgramId)) {
      return GROUP_NOT_FOUND;
    }
    const mentor = await readMentorOfToday(tx, group.id);
    if (!mentor) return GROUP_WITHOUT_MENTOR;
    const period = await findOffered(tx, input.periodId, day);
    if (period === null) return PERIOD_NOT_OFFERED;
    if (!heldDuring(period, mentor.since)) return NOT_HELD_THEN;

    const stored = await findEvaluation(tx, input);
    if (stored === null) {
      await addEvaluation(tx, actor.id, mentor.id, input);
      return saved(mentor.name, input);
    }
    if (stored.mentorId !== mentor.id) return OF_EARLIER_MENTOR;
    await correctEvaluation(tx, actor.id, stored, input);
    return saved(mentor.name, input);
  });
}
