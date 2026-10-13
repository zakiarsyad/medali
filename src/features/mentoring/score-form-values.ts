import { readScore } from "./score-input";

/** What the person typed, by the id of the student, for the boxes they touched. */
export type Typed = Readonly<Record<string, string>>;

/** A row as the form needs it: the student and the score kept for them. */
interface KeptRow {
  id: string;
  score: number | null;
}

/**
 * What a box holds, set against the score kept for its student: the same,
 * another score that is not saved yet, something that is no score, or
 * nothing where a score is kept.
 */
export type BoxState = "saved" | "unsaved" | "invalid" | "emptied";

/** What the box of a row shows: what was typed, or else the kept score. */
export function boxText(row: KeptRow, typed: Typed): string {
  return typed[row.id] ?? String(row.score ?? "");
}

export function boxState(row: KeptRow, typed: Typed): BoxState {
  const text = typed[row.id];
  if (text === undefined) return "saved";
  if (text.trim() === "") return row.score === null ? "saved" : "emptied";
  const score = readScore(text);
  if (score === null) return "invalid";
  return score === row.score ? "saved" : "unsaved";
}

/**
 * The score "Keterangan" speaks of: the one typed while it is not saved
 * yet, the kept one for a box that agrees with it, and none for a box
 * that holds no score.
 */
export function spokenScore(row: KeptRow, typed: Typed): number | null {
  const state = boxState(row, typed);
  if (state === "saved") return row.score;
  if (state === "unsaved") return readScore(typed[row.id] ?? "");
  return null;
}

/**
 * The students whose box "Simpan nilai" sends: those with a score that
 * is not saved yet, and those with something that is no score, which the
 * server refuses and the row explains.
 */
export function idsToSend(rows: readonly KeptRow[], typed: Typed): string[] {
  return rows
    .filter((row) => {
      const state = boxState(row, typed);
      return state === "unsaved" || state === "invalid";
    })
    .map((row) => row.id);
}

/** Whether a box holds something that is not what is kept. */
export function hasUnsavedScores(
  rows: readonly KeptRow[],
  typed: Typed,
): boolean {
  return rows.some((row) => boxState(row, typed) !== "saved");
}

/** What was typed, with the text of one box set. */
export function withTyped(
  typed: Typed,
  studentId: string,
  text: string,
): Typed {
  return { ...typed, [studentId]: text };
}

/** What the button reads: how many scores it saves, and no number while nothing is changed. */
export function saveButtonWords(count: number): string {
  if (count === 0) return "Simpan nilai";
  return `Simpan ${count} nilai`;
}

/**
 * What stays typed after a save: the boxes that were not sent, and those
 * the person changed again while the save was on its way. `sent` is what
 * was typed when the form was sent.
 */
export function afterSave(
  typed: Typed,
  sent: Typed,
  sentIds: readonly string[],
): Typed {
  const left: Record<string, string> = {};
  for (const [studentId, text] of Object.entries(typed)) {
    const wasSaved = sentIds.includes(studentId) && sent[studentId] === text;
    if (!wasSaved) left[studentId] = text;
  }
  return left;
}
