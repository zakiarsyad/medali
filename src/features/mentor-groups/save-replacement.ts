import { eq } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import type { AccountForAccess, RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import {
  accounts,
  mentorGroups,
  mentorReplacements,
  studyPrograms,
} from "@/db/schema";
import { brokeUniqueRule } from "@/db/unique-violation";
import { WRITTEN_NOW } from "@/db/written-now";
import { carryOutReplacement } from "@/mentoring/carry-out-replacement";
import { waitForOtherMentorChanges } from "@/mentoring/mentor-change-lock";
import { isKeptForReplacement } from "@/mentoring/waiting-replacement";
import type { Parsed } from "@/parsed";
import type { GroupCodeParts } from "@/ui/group-code";
import { resultOf } from "./evaluation-result";
import { readLastGroupEvaluations } from "./last-evaluations";
import { lockGroup, readMentorOfToday } from "./locked-group";
import type { ReplacementInput } from "./replacement-input";
import {
  alreadyScheduled,
  KEPT_FOR_ANOTHER_GROUP,
  MENTOR_CHANGED,
  NEEDS_POOR_EVALUATION,
  NO_MENTOR_TO_REPLACE,
  NOT_A_SPARE_MENTOR,
  NOT_ALLOWED_TO_REPLACE,
  STARTS_BEFORE_TODAY,
  startsBeforeOldMentor,
} from "./replacement-refusals";
import { GROUP_NOT_FOUND } from "./save-evaluation";
import { findSpareMentor } from "./spare-mentors";
import { maySeeGroup } from "./visible-groups";
import { replacedRowsFor } from "./visible-replacements";
import { readWaitingReplacementOf } from "./waiting-replacement-of";

/** The database's own rule: one waiting replacement for a group. */
const ONE_PER_GROUP = "mentor_replacements_one_waiting_per_group";
/** The database's own rule: a new mentor is named in one waiting replacement. */
const ONE_PER_NEW_MENTOR = "mentor_replacements_one_waiting_per_new_mentor";

type Refusal = { ok: false; error: string };

/** What "Tetapkan penggantian" tells the one who saved. */
export interface SavedReplacement {
  id: string;
  group: GroupCodeParts;
  newMentorName: string;
  startsOn: string;
  /** Whether the group has its new mentor already. False while it waits. */
  isInForce: boolean;
}

/** A group that is held, and the mentor who holds it today. */
interface HeldGroup {
  id: string;
  oldMentor: { id: string; since: string };
}

async function readGroupCode(
  tx: Database,
  groupId: string,
): Promise<GroupCodeParts> {
  const [group] = await tx
    .select({
      cohortYear: mentorGroups.cohortYear,
      entryPath: mentorGroups.entryPath,
      number: mentorGroups.number,
      programCode: studyPrograms.code,
    })
    .from(mentorGroups)
    .innerJoin(studyPrograms, eq(studyPrograms.id, mentorGroups.studyProgramId))
    .where(eq(mentorGroups.id, groupId));
  if (!group) throw new Error("The group that was locked is not there.");
  return group;
}

/**
 * Whether the last evaluation of the mentor of today for a group is
 * Kurang, by Kepala Unit or by the students' survey.
 */
async function hasPoorEvaluation(
  tx: Database,
  limit: RowLimit,
  groupId: string,
): Promise<boolean> {
  const last = await readLastGroupEvaluations(tx, limit, [groupId]);
  const average = last.get(groupId);
  return average !== undefined && resultOf(average) === "poor";
}

/** Why a group cannot get the replacement that was sent, or null when it can. */
async function whatStopsGroup(
  tx: Database,
  limit: RowLimit,
  group: HeldGroup,
  input: ReplacementInput,
): Promise<Refusal | null> {
  if (input.startsOn < group.oldMentor.since) {
    return startsBeforeOldMentor(group.oldMentor.since);
  }
  const waiting = await readWaitingReplacementOf(tx, group.id);
  if (waiting !== null) return alreadyScheduled(waiting.startsOn);
  if (input.reason !== "poor_evaluation") return null;
  if (await hasPoorEvaluation(tx, limit, group.id)) return null;
  return NEEDS_POOR_EVALUATION;
}

/**
 * Reads the new mentor as a spare mentor, and holds the account until the
 * transaction ends: its Pengasuh role is not taken and it is not removed
 * between this look and the save.
 */
async function lockSpareMentor(
  tx: Database,
  id: string,
): Promise<Parsed<{ name: string }>> {
  await tx
    .select({ id: accounts.id })
    .from(accounts)
    .where(eq(accounts.id, id))
    .for("share");
  if (await isKeptForReplacement(tx, id)) return KEPT_FOR_ANOTHER_GROUP;
  const spare = await findSpareMentor(tx, id);
  if (spare === null) return NOT_A_SPARE_MENTOR;
  return { ok: true, value: spare };
}

/**
 * What a save is told when the database's own rule refused it: another
 * save took the group or the new mentor after the looks above found them
 * free.
 */
async function refusedByRule(
  tx: Database,
  error: unknown,
  groupId: string,
): Promise<Refusal> {
  if (brokeUniqueRule(error, ONE_PER_NEW_MENTOR)) return KEPT_FOR_ANOTHER_GROUP;
  if (!brokeUniqueRule(error, ONE_PER_GROUP)) throw error;
  const waiting = await readWaitingReplacementOf(tx, groupId);
  if (waiting === null) throw error;
  return alreadyScheduled(waiting.startsOn);
}

/**
 * Adds the replacement in a step of its own, which alone is undone when
 * the database refuses it.
 */
async function addReplacement(
  tx: Database,
  actorId: string,
  input: ReplacementInput,
): Promise<Parsed<string>> {
  const values = { ...input, setBy: actorId, setAt: WRITTEN_NOW };
  try {
    const [added] = await tx.transaction((step) =>
      step
        .insert(mentorReplacements)
        .values(values)
        .returning({ id: mentorReplacements.id }),
    );
    if (!added) throw new Error("The replacement was not added.");
    return { ok: true, value: added.id };
  } catch (error) {
    return refusedByRule(tx, error, input.groupId);
  }
}

/** Gives the group its new mentor at once, for a replacement that starts today. */
async function carryOutNow(
  tx: Database,
  id: string,
  input: ReplacementInput,
): Promise<void> {
  const done = await carryOutReplacement(tx, { ...input, id });
  if (!done) throw new Error("The mentor that was read holds no group now.");
}

/**
 * "Tetapkan penggantian": keeps the replacement of the mentor who holds a
 * group today by a spare mentor, as the work of the actor. One that
 * starts on `day` gives the group its new mentor at once, in the same
 * transaction; one for a later day waits for it. Refused for any role but
 * Kepala Unit, for a start date before `day` or before the old mentor
 * took the group, for a group that is ended, has no mentor, has another
 * mentor than the one the form was filled in for, or has a replacement
 * that waits already, for Hasil evaluasi kurang while the
 * mentor's last evaluation for the group is not Kurang, and for a new
 * mentor who is not a spare mentor or is kept for another group: all of
 * it read here, never taken from the browser.
 */
export async function saveReplacement(
  db: Database,
  actor: AccountForAccess,
  input: ReplacementInput,
  day: string = campusDay(),
): Promise<Parsed<SavedReplacement>> {
  const limit = replacedRowsFor(actor);
  if (limit === null) return NOT_ALLOWED_TO_REPLACE;
  if (input.startsOn < day) return STARTS_BEFORE_TODAY;

  return db.transaction(async (tx) => {
    const group = await lockGroup(tx, input.groupId);
    if (!group || !maySeeGroup(limit, group.studyProgramId)) {
      return GROUP_NOT_FOUND;
    }
    const oldMentor = await readMentorOfToday(tx, group.id);
    if (!oldMentor) return NO_MENTOR_TO_REPLACE;
    if (oldMentor.id !== input.oldMentorId) return MENTOR_CHANGED;
    // Two replacements saved at the same moment would both read one
    // spare mentor as free.
    await waitForOtherMentorChanges(tx);
    const held = { id: group.id, oldMentor };
    const stopped = await whatStopsGroup(tx, limit, held, input);
    if (stopped !== null) return stopped;
    const newMentor = await lockSpareMentor(tx, input.newMentorId);
    if (!newMentor.ok) return newMentor;

    const added = await addReplacement(tx, actor.id, input);
    if (!added.ok) return added;
    const isInForce = input.startsOn <= day;
    if (isInForce) await carryOutNow(tx, added.value, input);
    return {
      ok: true,
      value: {
        id: added.value,
        group: await readGroupCode(tx, group.id),
        newMentorName: newMentor.value.name,
        startsOn: input.startsOn,
        isInForce,
      },
    };
  });
}
