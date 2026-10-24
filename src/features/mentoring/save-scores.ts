import { campusDay } from "@/academic-periods/campus-day";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import {
  finalScoreOf,
  INDICATOR_COUNT,
  isIndicatorScore,
} from "@/mentoring/score-indicators";
import type { Parsed } from "@/parsed";
import { mayFillInFor } from "./attendance-groups";
import { listActiveMembers } from "./group-meetings";
import { lockGroup, readMentorOfToday } from "./held-group";
import { readIndicators } from "./indicator-set";
import {
  keptKey,
  NOT_INDICATOR_SCORE,
  type ScoresInput,
  SOME_INCOMPLETE,
} from "./score-input";
import { givenRowsFor } from "./visible-scores";
import {
  addScore,
  changeScore,
  type GivenScore,
  type KeptScore,
  readKeptScores,
} from "./write-scores";

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

/** What a save answers when a score of an indicator is no whole number from 1 to 5. */
export const NOT_SCORES = { ok: false, error: NOT_INDICATOR_SCORE } as const;

/** What a save answers when a mentee is sent other than six indicator scores. */
export const NOT_SIX_SCORES = { ok: false, error: SOME_INCOMPLETE } as const;

/**
 * What a save answers when a score kept is not the one its box was
 * opened on: it was saved in between, by a second press or from another
 * window. Nothing of the save is kept.
 */
export interface ScoresChanged {
  ok: false;
  error: string;
  /** The students whose score changed in between, for the form to show the latest. */
  changedIds: string[];
}

export function scoresChanged(changedIds: string[]): ScoresChanged {
  return {
    ok: false,
    error:
      "Ada nilai yang sudah berubah sejak halaman dibuka, jadi belum ada nilai yang disimpan. Nilai terbarunya sekarang ditampilkan. Ubah lagi bila masih perlu, lalu simpan lagi.",
    changedIds,
  };
}

/** A kept score as `changedSince` reads it. */
type KeptForCheck = Pick<KeptScore, "score" | "indicatorScores">;

/**
 * The students whose kept score is not the one the form was opened on.
 * `basedOn` holds what each row was opened on, as `keptKey` writes it,
 * and `kept` the score kept now for each student who has one.
 */
export function changedSince(
  basedOn: Readonly<Record<string, string>>,
  kept: ReadonlyMap<string, KeptForCheck>,
): string[] {
  const changedIds: string[] = [];
  for (const [studentId, before] of Object.entries(basedOn)) {
    if (keptKey(kept.get(studentId)) !== before) changedIds.push(studentId);
  }
  return changedIds;
}

/** Why the six scores of the rows sent cannot be saved, or null when they can. */
function sixScoresFault(
  scores: Readonly<Record<string, number[]>>,
): typeof NOT_SIX_SCORES | typeof NOT_SCORES | null {
  const rows = Object.values(scores);
  if (rows.some((six) => six.length !== INDICATOR_COUNT)) return NOT_SIX_SCORES;
  if (!rows.every((six) => six.every(isIndicatorScore))) return NOT_SCORES;
  return null;
}

/** The score six indicator scores give, with the names they are given with. */
function givenScoreOf(six: number[], names: string[]): GivenScore {
  const score = finalScoreOf(six);
  if (score === null) throw new Error("Six indicator scores give a score.");
  return { score, indicatorScores: six, indicatorNames: names };
}

/** What "Simpan nilai" tells the one who saved. */
export interface SavedScores {
  /** The students whose score is kept now as it was sent. */
  savedIds: string[];
}

/**
 * "Simpan nilai": keeps the six indicator scores sent for members of one
 * group in the period that runs on `day`, with the final score they give
 * and the names of the indicators in force, as the work of the actor,
 * each with a line in the log. A student without a score gets their
 * first; a student who has one, of six indicators or given before them,
 * gets the new score in its place, and six that are the ones kept write
 * nothing. Refused, with nothing saved, for any role but Pengasuh, for a
 * group the actor does not hold today, while no period runs, for a row
 * that is not six whole numbers from 1 to 5, for a score of someone who is no Aktif
 * member of the group today, and for a form opened on another score than
 * the one kept now, a second press or a second window.
 */
export async function saveScores(
  db: Database,
  actor: AccountForAccess,
  input: ScoresInput,
  day: string = campusDay(),
): Promise<Parsed<SavedScores> | ScoresChanged> {
  const limit = givenRowsFor(actor);
  if (limit === null) return NOT_ALLOWED_TO_SCORE;
  const studentIds = Object.keys(input.scores);
  const fault = sixScoresFault(input.scores);
  if (fault !== null) return fault;

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
    const changedIds = changedSince(input.basedOn, kept);
    if (changedIds.length > 0) return scoresChanged(changedIds);
    const { indicators } = await readIndicators(tx);
    const names = indicators.map((indicator) => indicator.name);
    for (const [studentId, six] of Object.entries(input.scores)) {
      const given = givenScoreOf(six, names);
      const keptScore = kept.get(studentId);
      if (keptScore === undefined) {
        await addScore(tx, actor.id, {
          studentId,
          periodId: period.id,
          ...given,
        });
        continue;
      }
      if (keptKey(keptScore) === keptKey(given)) continue;
      await changeScore(tx, actor.id, keptScore, given);
    }
    return { ok: true, value: { savedIds: studentIds } };
  });
}
