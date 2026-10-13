import { campusDay } from "@/academic-periods/campus-day";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isScore } from "@/mentoring/score-range";
import type { Parsed } from "@/parsed";
import { mayFillInFor } from "./attendance-groups";
import { listActiveMembers } from "./group-meetings";
import { lockGroup, readMentorOfToday } from "./held-group";
import { NOT_A_SCORE, type ScoresInput } from "./score-input";
import { givenRowsFor } from "./visible-scores";
import { addScore, changeScore, readKeptScores } from "./write-scores";

/** What a save answers to any role but Pengasuh. */
export const NOT_ALLOWED_TO_SCORE = {
  ok: false,
  error: "Nilai pengasuhan hanya diisi oleh pengasuh.",
} as const;

/**
 * What a save answers for every group the sender does not hold today: one
 * of another mentor, one they held before, one that is ended and one that
 * does not exist. The one answer tells nothing about a group the sender
 * may not see.
 */
export const SCORED_GROUP_NOT_HELD = {
  ok: false,
  error:
    "Kelompok ini tidak Anda asuh saat ini, sehingga nilainya tidak dapat Anda isi. Muat ulang halaman, lalu pilih kelompok yang Anda asuh.",
} as const;

export const NO_PERIOD_TO_SCORE = {
  ok: false,
  error:
    "Belum ada periode akademik yang berjalan, sehingga nilai pengasuhan belum dapat disimpan.",
} as const;

/**
 * What a save answers when it holds a score for someone who is no Aktif
 * member of the group today: a student of another group, one who has
 * left, one on Cuti, or one who does not exist.
 */
export const NOT_MEMBERS_TO_SCORE = {
  ok: false,
  error:
    "Ada nilai untuk mahasiswa yang bukan anak asuh aktif kelompok ini saat ini, jadi belum ada nilai yang disimpan. Muat ulang halaman, lalu isi lagi.",
} as const;

export const NOT_SCORES = { ok: false, error: NOT_A_SCORE } as const;

/** What "Simpan nilai" tells the one who saved. */
export interface SavedScores {
  /** The students whose score is kept now as it was sent. */
  savedIds: string[];
}

/**
 * "Simpan nilai": keeps the scores sent for members of one group in the
 * period that runs on `day`, as the work of the actor, each with a line
 * in the log. A student without a score gets their first; a student who
 * has one gets the new score in its place. Refused, with nothing saved,
 * for any role but Pengasuh, for a group the actor does not hold today,
 * while no period runs, for what is no score, and for a score of someone
 * who is no Aktif member of the group today.
 */
export async function saveScores(
  db: Database,
  actor: AccountForAccess,
  input: ScoresInput,
  day: string = campusDay(),
): Promise<Parsed<SavedScores>> {
  const limit = givenRowsFor(actor);
  if (limit === null) return NOT_ALLOWED_TO_SCORE;
  const studentIds = Object.keys(input.scores);
  if (!Object.values(input.scores).every(isScore)) return NOT_SCORES;

  return db.transaction(async (tx) => {
    if (!(await lockGroup(tx, input.groupId))) return SCORED_GROUP_NOT_HELD;
    const mentorId = await readMentorOfToday(tx, input.groupId);
    if (!mayFillInFor(limit, mentorId)) return SCORED_GROUP_NOT_HELD;
    const period = await readRunningPeriod(tx, day);
    if (period === null) return NO_PERIOD_TO_SCORE;
    const members = await listActiveMembers(tx, input.groupId);
    const memberIds = members.map((member) => member.id);
    if (!studentIds.every((id) => memberIds.includes(id))) {
      return NOT_MEMBERS_TO_SCORE;
    }
    const kept = await readKeptScores(tx, period.id, studentIds);
    for (const [studentId, score] of Object.entries(input.scores)) {
      const keptScore = kept.get(studentId);
      if (keptScore === undefined) {
        await addScore(tx, actor.id, { studentId, periodId: period.id, score });
      } else {
        await changeScore(tx, actor.id, keptScore, score);
      }
    }
    return { ok: true, value: { savedIds: studentIds } };
  });
}
