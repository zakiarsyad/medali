import type { NoteCategory } from "./violation-note-ids";

/*
 * The Kategori of a violation note and whether its student repeats.
 * Read by the screen parts in the browser, so nothing here may take from
 * the database code. The reads of the list ask the same in their `where`,
 * which its checks confirm.
 */

/**
 * The Kategori of a note by its place among the notes of its student in
 * the semester of its Tanggal that are not removed, the earliest first:
 * the first is Pelanggaran pertama, every later one Pelanggaran lanjutan.
 * A removed note leaves the count, so the notes after it move up.
 */
export function categoryAt(place: number): NoteCategory {
  return place <= 1 ? "first" : "further";
}

/** Whether a student with this many active notes is "Mahasiswa berulang". */
export function isRepeated(activeNotes: number): boolean {
  return activeNotes >= 2;
}

/**
 * What a row of a repeated student says: how many active notes they
 * have. Null for a student who does not repeat, or a note not active.
 */
export function repeatWords(activeNotes: number | null): string | null {
  if (activeNotes === null || !isRepeated(activeNotes)) return null;
  return `${activeNotes} catatan aktif`;
}
