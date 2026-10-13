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
import { WRITTEN_NOW } from "@/db/written-now";
import { carryOutReplacement } from "@/mentoring/carry-out-replacement";
import { waitForOtherMentorChanges } from "@/mentoring/mentor-change-lock";
import type { Parsed } from "@/parsed";
import { shownDay } from "@/ui/day";
import type { GroupCodeParts } from "@/ui/group-code";
import { evaluationResult } from "./evaluation-result";
import { readLastGroupEvaluations } from "./last-evaluations";
import { lockGroup, readMentorOfToday } from "./locked-group";
import type { ReplacementInput } from "./replacement-input";
import { GROUP_NOT_FOUND } from "./save-evaluation";
import { findSpareMentor } from "./spare-mentors";
import { maySeeGroup } from "./visible-groups";
import { replacedRowsFor } from "./visible-replacements";

/** What a save answers to any role but Kepala Unit. */
export const NOT_ALLOWED_TO_REPLACE = {
  ok: false,
  error: "Anda tidak berhak menetapkan penggantian pengasuh.",
} as const;

export const NO_MENTOR_TO_REPLACE = {
  ok: false,
  error:
    "Kelompok ini belum memiliki pengasuh, sehingga belum ada yang diganti.",
} as const;

export const STARTS_BEFORE_TODAY = {
  ok: false,
  error:
    "Tanggal efektif tidak boleh sebelum hari ini. Pilih hari ini atau tanggal sesudahnya.",
} as const;

/**
 * What a save is told for a start date before the day the mentor of today
 * took the group: that mentor's time with the group cannot end before it
 * began.
 */
export function startsBeforeOldMentor(since: string) {
  return {
    ok: false,
    error: `Tanggal efektif tidak boleh sebelum pengasuh saat ini mulai mengasuh kelompok ini, ${shownDay(since)}.`,
  } as const;
}

/** What a save is told when Hasil evaluasi kurang has no evaluation to stand on. */
export const NEEDS_POOR_EVALUATION = {
  ok: false,
  error:
    "Evaluasi terakhir pengasuh ini di kelompok tersebut bukan Kurang, sehingga alasan Hasil evaluasi kurang belum bisa dipakai. Lakukan evaluasi dulu, atau pilih alasan lain.",
} as const;

export const NOT_A_SPARE_MENTOR = {
  ok: false,
  error:
    "Pengasuh pengganti ini bukan pengasuh cadangan lagi. Pilih pengasuh cadangan lain dari daftar.",
} as const;

/** What "Tetapkan penggantian" tells the one who saved. */
export interface SavedReplacement {
  id: string;
  group: GroupCodeParts;
  newMentorName: string;
  startsOn: string;
  /** Whether the group has its new mentor already. False while it waits. */
  isInForce: boolean;
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

/** Whether the last evaluation of the mentor of today for a group is Kurang. */
async function hasPoorEvaluation(
  tx: Database,
  limit: RowLimit,
  groupId: string,
): Promise<boolean> {
  const last = await readLastGroupEvaluations(tx, limit, [groupId]);
  const scores = last.get(groupId);
  return scores !== undefined && evaluationResult(scores) === "poor";
}

async function addReplacement(
  tx: Database,
  actorId: string,
  oldMentorId: string,
  input: ReplacementInput,
): Promise<string> {
  const [added] = await tx
    .insert(mentorReplacements)
    .values({ ...input, oldMentorId, setBy: actorId, setAt: WRITTEN_NOW })
    .returning({ id: mentorReplacements.id });
  if (!added) throw new Error("The replacement was not added.");
  return added.id;
}

/**
 * Reads the new mentor as a spare mentor, and holds the account until the
 * transaction ends: its Pengasuh role is not taken and it is not removed
 * between this look and the save.
 */
async function lockSpareMentor(tx: Database, id: string) {
  await tx
    .select({ id: accounts.id })
    .from(accounts)
    .where(eq(accounts.id, id))
    .for("share");
  return findSpareMentor(tx, id);
}

/** Gives the group its new mentor at once, for a replacement that starts today. */
async function carryOutNow(
  tx: Database,
  id: string,
  oldMentorId: string,
  input: ReplacementInput,
): Promise<void> {
  const done = await carryOutReplacement(tx, { ...input, id, oldMentorId });
  if (!done) throw new Error("The mentor that was read holds no group now.");
}

/**
 * "Tetapkan penggantian": keeps the replacement of the mentor who holds a
 * group today by a spare mentor, as the work of the actor. One that
 * starts on `day` gives the group its new mentor at once, in the same
 * transaction; one for a later day waits for it. Refused for any role but
 * Kepala Unit, for a start date before `day` or before the old mentor
 * took the group, for a group that is ended or has no mentor, for Hasil
 * evaluasi kurang while the mentor's last evaluation for the group is not
 * Kurang, and for a new mentor who is not a spare mentor: all of it read
 * here, never taken from the browser.
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
    if (input.startsOn < oldMentor.since) {
      return startsBeforeOldMentor(oldMentor.since);
    }
    // Two replacements saved at the same moment would both read one
    // spare mentor as free.
    await waitForOtherMentorChanges(tx);
    const needsEvaluation =
      input.reason === "poor_evaluation" &&
      !(await hasPoorEvaluation(tx, limit, group.id));
    if (needsEvaluation) return NEEDS_POOR_EVALUATION;
    const newMentor = await lockSpareMentor(tx, input.newMentorId);
    if (!newMentor) return NOT_A_SPARE_MENTOR;

    const id = await addReplacement(tx, actor.id, oldMentor.id, input);
    const isInForce = input.startsOn <= day;
    if (isInForce) await carryOutNow(tx, id, oldMentor.id, input);
    return {
      ok: true,
      value: {
        id,
        group: await readGroupCode(tx, group.id),
        newMentorName: newMentor.name,
        startsOn: input.startsOn,
        isInForce,
      },
    };
  });
}
