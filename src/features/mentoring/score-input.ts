import { isUuid } from "@/db/is-uuid";
import { isScore, SCORE_MAX, SCORE_MIN } from "@/mentoring/score-range";
import type { Parsed } from "@/parsed";

/** A score as the form sends it: the id of the student, then what the box holds. */
type SentScore = [studentId: string, score: string];

/** "Simpan nilai" as the form sends it. */
export interface SentScores {
  groupId: string;
  scores: SentScore[];
}

export interface ScoresInput {
  groupId: string;
  /** The new score of each student, by the id of the student. */
  scores: Record<string, number>;
}

/** What the name of a field that holds a student's score starts with. */
const SCORE_FIELD_START = "score.";

/** The name of the field that holds the score of one student. */
export function scoreField(studentId: string): string {
  return `${SCORE_FIELD_START}${studentId}`;
}

/**
 * The scores a sent form holds, one for each box of a student that is not
 * empty. An empty box sends nothing, so a saved score is never emptied.
 */
export function sentScores(form: FormData): SentScore[] {
  const scores: SentScore[] = [];
  for (const [name, value] of form.entries()) {
    if (!name.startsWith(SCORE_FIELD_START)) continue;
    if (typeof value !== "string" || value.trim() === "") continue;
    scores.push([name.slice(SCORE_FIELD_START.length), value]);
  }
  return scores;
}

/** As many digits as the highest score has, and nothing else. */
const WHOLE_NUMBER = /^\d{1,3}$/;

/**
 * The score a box holds, or null when what it holds is no whole number
 * in the range. The blanks around it do not count.
 */
export function readScore(text: string): number | null {
  const digits = text.trim();
  if (!WHOLE_NUMBER.test(digits)) return null;
  const score = Number(digits);
  return isScore(score) ? score : null;
}

/** What a row says of a box that holds no score. */
export const NOT_A_SCORE = `Nilai harus bilangan bulat dari ${SCORE_MIN} sampai ${SCORE_MAX}.`;

const SOME_ARE_NO_SCORE = `Ada nilai yang bukan bilangan bulat dari ${SCORE_MIN} sampai ${SCORE_MAX}, jadi belum ada nilai yang disimpan. Perbaiki nilai yang ditandai, lalu simpan lagi.`;

const INCOMPLETE =
  "Formulir ini tidak lengkap. Muat ulang halaman, lalu isi lagi.";

function refused(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

/**
 * Checks "Simpan nilai" as sent: every score is a whole number in the
 * range, for one student each. One box that holds no score refuses the
 * whole save. Whether the group and its members are the sender's is
 * decided where the scores are saved.
 */
export function parseScores(sent: SentScores): Parsed<ScoresInput> {
  if (!isUuid(sent.groupId)) return refused(INCOMPLETE);
  if (sent.scores.length === 0) return refused("Belum ada nilai yang diubah.");
  const scores: Record<string, number> = {};
  for (const [studentId, text] of sent.scores) {
    const isTwice = Object.hasOwn(scores, studentId);
    if (isTwice || !isUuid(studentId)) return refused(INCOMPLETE);
    const score = readScore(text);
    if (score === null) return refused(SOME_ARE_NO_SCORE);
    scores[studentId] = score;
  }
  return { ok: true, value: { groupId: sent.groupId, scores } };
}
