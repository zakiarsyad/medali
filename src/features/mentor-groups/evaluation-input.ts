import { isUuid } from "@/db/is-uuid";
import type { Parsed } from "@/parsed";
import {
  ASPECT_TITLES,
  EVALUATION_ASPECTS,
  type EvaluationAspect,
  type EvaluationScores,
  SCORE_MAX,
  SCORE_MIN,
} from "./evaluation-aspects";

/** "Simpan evaluasi" as the form sends it. */
export type SentEvaluation = TypedScores & {
  groupId: string;
  periodId: string;
  note: string;
};

export interface EvaluationInput {
  groupId: string;
  periodId: string;
  scores: EvaluationScores;
  /** Null for an evaluation without a note. */
  note: string | null;
}

export const NOTE_MAX_LENGTH = 1000;

const WHOLE_NUMBER = /^\d{1,3}$/;
const RANGE = `${SCORE_MIN} sampai ${SCORE_MAX}`;

/** The value a field holds, or null when it holds no whole number of 0 to 100. */
export function scoreOf(sent: string): number | null {
  const typed = sent.trim();
  if (!WHOLE_NUMBER.test(typed)) return null;
  const score = Number(typed);
  return score <= SCORE_MAX ? score : null;
}

/** The four fields as typed. */
export type TypedScores = Record<EvaluationAspect, string>;

/** What each field holds: its value, or null where it holds none. */
type ReadScores = Record<EvaluationAspect, number | null>;

export function readScores(typed: TypedScores): ReadScores {
  return {
    activity: scoreOf(typed.activity),
    attendance: scoreOf(typed.attendance),
    achievement: scoreOf(typed.achievement),
    feedback: scoreOf(typed.feedback),
  };
}

/** Whether every one of the four fields holds a value. */
export function isComplete(scores: ReadScores): scores is EvaluationScores {
  return EVALUATION_ASPECTS.every((aspect) => scores[aspect] !== null);
}

function refusedScore(aspect: EvaluationAspect, sent: string): string {
  const title = ASPECT_TITLES[aspect];
  if (sent.trim() === "") return `Isi nilai ${title} dengan angka ${RANGE}.`;
  return `Nilai ${title} harus bilangan bulat dari ${RANGE}.`;
}

/** The message that names the first field without a value. */
function refusedScores(typed: TypedScores, scores: ReadScores): string {
  for (const aspect of EVALUATION_ASPECTS) {
    if (scores[aspect] === null) return refusedScore(aspect, typed[aspect]);
  }
  throw new Error("Every field holds a value, so none is refused.");
}

/** The four values, or the message that names the first one that is wrong. */
function parseScores(sent: SentEvaluation): Parsed<EvaluationScores> {
  const scores = readScores(sent);
  if (isComplete(scores)) return { ok: true, value: scores };
  return { ok: false, error: refusedScores(sent, scores) };
}

/**
 * Checks "Simpan evaluasi" as sent. Every value must be there and be a
 * whole number of 0 to 100: one that is not is refused by name, never
 * brought into range.
 */
export function parseEvaluation(sent: SentEvaluation): Parsed<EvaluationInput> {
  if (!isUuid(sent.groupId)) {
    return { ok: false, error: "Pilih kelompok pengasuhan." };
  }
  if (!isUuid(sent.periodId)) return { ok: false, error: "Pilih periode." };
  const scores = parseScores(sent);
  if (!scores.ok) return scores;
  const note = sent.note.trim();
  if (note.length > NOTE_MAX_LENGTH) {
    return {
      ok: false,
      error: `Catatan evaluasi paling panjang ${NOTE_MAX_LENGTH.toLocaleString("id-ID")} karakter.`,
    };
  }
  return {
    ok: true,
    value: {
      groupId: sent.groupId,
      periodId: sent.periodId,
      scores: scores.value,
      note: note === "" ? null : note,
    },
  };
}
