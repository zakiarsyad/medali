import { finalScoreOf, INDICATOR_COUNT } from "@/mentoring/score-indicators";
import { readIndicatorScore } from "./score-input";

/** What was chosen, six choices by the id of the student, for the rows the person touched. */
export type Typed = Readonly<Record<string, readonly string[]>>;

/** A row as the form needs it: the student and the score kept for them. */
interface KeptRow {
  id: string;
  /** The final score kept, or null for none. */
  score: number | null;
  /** The six indicator scores kept, or null for none or a score given before them. */
  indicatorScores: readonly number[] | null;
}

/**
 * What the six choices of a row hold, set against the score kept for its
 * student: the same, six others that are not saved yet, or only part of
 * the six.
 */
export type RowState = "saved" | "unsaved" | "incomplete";

/** The six choices a row shows before anything is chosen: the kept ones, or six empty. */
function keptChoices(row: KeptRow): string[] {
  const choices: string[] = [];
  for (let place = 0; place < INDICATOR_COUNT; place++) {
    const kept = row.indicatorScores?.[place];
    choices.push(kept === undefined ? "" : String(kept));
  }
  return choices;
}

function isSameSix(one: readonly string[], other: readonly string[]): boolean {
  return one.every((choice, place) => choice === other[place]);
}

/** The scores the six choices hold, null for an empty one or one that holds no score. */
function chosenScores(choices: readonly string[]): (number | null)[] {
  return choices.map(readIndicatorScore);
}

/** What one choice of a row shows: what was chosen, or else the kept indicator score. */
export function choiceText(row: KeptRow, typed: Typed, place: number): string {
  const choices = typed[row.id] ?? keptChoices(row);
  return choices[place] ?? "";
}

export function rowState(row: KeptRow, typed: Typed): RowState {
  const choices = typed[row.id];
  if (choices === undefined) return "saved";
  if (isSameSix(choices, keptChoices(row))) return "saved";
  const isAllEmpty = choices.every((choice) => choice === "");
  if (isAllEmpty && row.indicatorScores === null) return "saved";
  if (finalScoreOf(chosenScores(choices)) === null) return "incomplete";
  return "unsaved";
}

/**
 * The score "Nilai akhir" and "Keterangan" speak of: the final score of
 * the six chosen while they are not saved yet, the kept one for a row
 * that agrees with it, and none for a row with only part of the six.
 */
export function spokenScore(row: KeptRow, typed: Typed): number | null {
  const state = rowState(row, typed);
  if (state === "saved") return row.score;
  if (state === "incomplete") return null;
  return finalScoreOf(chosenScores(typed[row.id] ?? []));
}

/**
 * The students whose row "Simpan nilai" sends: those with six that are
 * not saved yet, and those with only part of the six, which the server
 * refuses and the row explains.
 */
export function idsToSend(rows: readonly KeptRow[], typed: Typed): string[] {
  return rows
    .filter((row) => rowState(row, typed) !== "saved")
    .map((row) => row.id);
}

/** Whether a row holds something that is not what is kept. */
export function hasUnsavedScores(
  rows: readonly KeptRow[],
  typed: Typed,
): boolean {
  return rows.some((row) => rowState(row, typed) !== "saved");
}

/** What was chosen, with one choice of one row set. */
export function withTyped(
  typed: Typed,
  row: KeptRow,
  place: number,
  text: string,
): Typed {
  const choices = [...(typed[row.id] ?? keptChoices(row))];
  choices[place] = text;
  return { ...typed, [row.id]: choices };
}

/**
 * What was chosen, without the rows of these students: each goes back to
 * the score kept for its student.
 */
export function withoutBoxes(
  typed: Typed,
  studentIds: readonly string[],
): Typed {
  const left: Record<string, readonly string[]> = {};
  for (const [studentId, choices] of Object.entries(typed)) {
    if (!studentIds.includes(studentId)) left[studentId] = choices;
  }
  return left;
}

/** What the button reads: how many scores it saves, and no number while nothing is changed. */
export function saveButtonWords(count: number): string {
  if (count === 0) return "Simpan nilai";
  return `Simpan ${count} nilai`;
}

/**
 * What stays chosen after a save: the rows that were not sent, and those
 * the person changed again while the save was on its way. `sent` is what
 * was chosen when the form was sent.
 */
export function afterSave(
  typed: Typed,
  sent: Typed,
  sentIds: readonly string[],
): Typed {
  const left: Record<string, readonly string[]> = {};
  for (const [studentId, choices] of Object.entries(typed)) {
    const sentChoices = sent[studentId];
    const wasSaved =
      sentIds.includes(studentId) &&
      sentChoices !== undefined &&
      isSameSix(choices, sentChoices);
    if (!wasSaved) left[studentId] = choices;
  }
  return left;
}
