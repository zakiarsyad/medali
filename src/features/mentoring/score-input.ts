import { isUuid } from "@/db/is-uuid";
import {
  INDICATOR_COUNT,
  INDICATOR_SCORE_MAX,
  INDICATOR_SCORE_MIN,
  isIndicatorScore,
} from "@/mentoring/score-indicators";
import type { Parsed } from "@/parsed";
import { text } from "@/ui/form-data";
import { STARTING_INDICATORS_VERSION } from "./indicator-version";

/**
 * A row as the form sends it: the id of the student, what each of the
 * six choices holds, and what the row was opened on, as `keptKey` writes it.
 */
type SentScore = [studentId: string, scores: string[], basedOn: string];

/** "Simpan nilai" as the form sends it. */
export interface SentScores {
  groupId: string;
  /** The version of the indicators the form was opened on. */
  indicatorsVersion: string;
  scores: SentScore[];
}

export interface ScoresInput {
  groupId: string;
  /**
   * The version of the indicators the form was opened on: its columns
   * name them, so the six of a row are given on these.
   */
  indicatorsVersion: string;
  /** The six new indicator scores of each student, by the id of the student. */
  scores: Record<string, number[]>;
  /**
   * What each of these students had kept when the form was opened, as
   * `keptKey` writes it, empty for one who had nothing then. A score
   * saved in between is not written over.
   */
  basedOn: Record<string, string>;
}

/** A kept score as `keptKey` reads it, with a null score for none. */
interface KeptForKey {
  score: number | null;
  indicatorScores: readonly number[] | null;
}

/**
 * What tells a kept score apart from another: its six indicator scores,
 * or the score itself for one given before the indicators, and empty for
 * none.
 */
export function keptKey(kept: KeptForKey | null | undefined): string {
  if (!kept || kept.score === null) return "";
  if (kept.indicatorScores === null) return String(kept.score);
  return kept.indicatorScores.join(",");
}

/** A key `keptKey` can write: nothing, six indicator scores, or a whole score. */
const KEPT_KEY = /^(|\d(,\d){5}|\d{1,3}(\.\d)?)$/;

/** The field that holds the version of the indicators the form was opened on. */
export const INDICATORS_VERSION_OF_SCORES = "indicatorsVersion";

/** A version of the indicators: the starting one, or the id of a setting. */
function isIndicatorsVersion(version: string): boolean {
  return version === STARTING_INDICATORS_VERSION || isUuid(version);
}

/** What the name of a field that holds a choice of a student starts with. */
const SCORE_FIELD_START = "score.";

/** The name of the field that holds the choice of one student on one indicator. */
export function scoreField(studentId: string, place: number): string {
  return `${SCORE_FIELD_START}${studentId}.${place}`;
}

/** The name of the field that holds what the row of one student was opened on. */
export function basedField(studentId: string): string {
  return `based.${studentId}`;
}

/** The student and the place of a field that holds a choice, or null for another field. */
function choiceOf(name: string): { studentId: string; place: number } | null {
  if (!name.startsWith(SCORE_FIELD_START)) return null;
  const rest = name.slice(SCORE_FIELD_START.length);
  const dot = rest.lastIndexOf(".");
  if (dot === -1) return null;
  const place = Number(rest.slice(dot + 1));
  if (!Number.isInteger(place) || place < 0 || place >= INDICATOR_COUNT) {
    return null;
  }
  return { studentId: rest.slice(0, dot), place };
}

/**
 * The rows a sent form holds: for each student whose choices carry a
 * name, the six choices, an empty one as empty, and what the row was
 * opened on.
 */
export function sentScores(form: FormData): SentScore[] {
  const rows = new Map<string, string[]>();
  for (const [name, value] of form.entries()) {
    const choice = choiceOf(name);
    if (choice === null) continue;
    const six = rows.get(choice.studentId) ?? Array(INDICATOR_COUNT).fill("");
    six[choice.place] = typeof value === "string" ? value.trim() : "";
    rows.set(choice.studentId, six);
  }
  return [...rows].map(([studentId, six]) => [
    studentId,
    six,
    text(form, basedField(studentId)),
  ]);
}

/** One digit, and nothing else. */
const ONE_DIGIT = /^\d$/;

/** The score a choice holds, or null when it holds no whole number from 1 to 5. */
export function readIndicatorScore(text: string): number | null {
  if (!ONE_DIGIT.test(text)) return null;
  const score = Number(text);
  return isIndicatorScore(score) ? score : null;
}

/** What a row says when only part of its six are filled in. */
export const ROW_INCOMPLETE = "Lengkapi enam indikator";

export const SOME_INCOMPLETE =
  "Ada anak asuh yang belum dinilai pada keenam indikator, jadi belum ada nilai yang disimpan. Lengkapi enam indikator pada baris yang ditandai, lalu simpan lagi.";

export const NOT_INDICATOR_SCORE = `Nilai indikator harus bilangan bulat dari ${INDICATOR_SCORE_MIN} sampai ${INDICATOR_SCORE_MAX}, jadi belum ada nilai yang disimpan. Muat ulang halaman, lalu isi lagi.`;

const INCOMPLETE_FORM =
  "Formulir ini tidak lengkap. Muat ulang halaman, lalu isi lagi.";

function refused(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

/** The six scores of a row, or why the whole save is refused. */
function readSix(texts: readonly string[]): Parsed<number[]> {
  if (texts.length !== INDICATOR_COUNT) return refused(SOME_INCOMPLETE);
  if (texts.some((choice) => choice === "")) return refused(SOME_INCOMPLETE);
  const scores: number[] = [];
  for (const choice of texts) {
    const score = readIndicatorScore(choice);
    if (score === null) return refused(NOT_INDICATOR_SCORE);
    scores.push(score);
  }
  return { ok: true, value: scores };
}

/**
 * Checks "Simpan nilai" as sent: six whole numbers from 1 to 5 for each
 * student, one row each. One row with only part of the six, or with what
 * is no indicator score, refuses the whole save. Whether the group and
 * its members are the sender's is decided where the scores are saved.
 */
export function parseScores(sent: SentScores): Parsed<ScoresInput> {
  if (!isUuid(sent.groupId)) return refused(INCOMPLETE_FORM);
  if (!isIndicatorsVersion(sent.indicatorsVersion)) {
    return refused(INCOMPLETE_FORM);
  }
  if (sent.scores.length === 0) return refused("Belum ada nilai yang diubah.");
  const scores: Record<string, number[]> = {};
  const basedOn: Record<string, string> = {};
  for (const [studentId, texts, openedOn] of sent.scores) {
    const isTwice = Object.hasOwn(scores, studentId);
    if (isTwice || !isUuid(studentId)) return refused(INCOMPLETE_FORM);
    if (!KEPT_KEY.test(openedOn)) return refused(INCOMPLETE_FORM);
    const six = readSix(texts);
    if (!six.ok) return six;
    scores[studentId] = six.value;
    basedOn[studentId] = openedOn;
  }
  const { groupId, indicatorsVersion } = sent;
  return { ok: true, value: { groupId, indicatorsVersion, scores, basedOn } };
}
