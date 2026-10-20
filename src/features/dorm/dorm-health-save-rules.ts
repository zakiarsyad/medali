import type { HealthNote, NoteIllness } from "@/health-notes/health-ids";
import type { NoteInput } from "@/health-notes/health-input";

function illnessesText(illnesses: readonly NoteIllness[]): string {
  return illnesses
    .map((each) => `${each.illness}:${each.note}`)
    .sort()
    .join("\n");
}

/**
 * Whether the note part sent says what the student's latest note says,
 * with no Pemeriksa typed: the form as it was filled from that note,
 * untouched. Tanggal is left out, as it starts at today on every form.
 */
export function repeatsLatestNote(
  input: NoteInput,
  latest: HealthNote | undefined,
): boolean {
  if (latest === undefined) return false;
  if (input.examiner !== null) return false;
  return (
    input.otherHistory === latest.otherHistory &&
    input.medicine === latest.medicine &&
    input.advice === latest.advice &&
    input.category === latest.category &&
    illnessesText(input.illnesses) === illnessesText(latest.illnesses)
  );
}

/** What a press of "Simpan catatan" on Asrama > Kesehatan sent and found. */
export interface SaveFacts {
  /** No illness and no text in the note part. */
  noteEmpty: boolean;
  /** The note part is the latest note, untouched. */
  repeatsLatest: boolean;
  /** The mark changes, or this form's change of it is kept already. */
  markDecides: boolean;
}

/**
 * Whether the save keeps a health note. A mark is saved without one:
 * the form is filled from the latest note, so setting only the mark
 * must not copy that note under today's date. Without a change of the
 * mark the note rules stay as they were, a repeat of the latest note
 * included.
 */
export function savesNote(facts: SaveFacts): boolean {
  if (facts.noteEmpty) return false;
  if (!facts.markDecides) return true;
  return !facts.repeatsLatest;
}
