import { may } from "@/auth/access";
import type { Database } from "@/db/connect";
import type { Parsed } from "@/parsed";
import { addStudents } from "./add-student";
import { type FilePreview, previewOf } from "./file-preview";
import { type Actor, NOT_ALLOWED } from "./input-student";
import { uploadSource } from "./labels";
import { skipRegistered } from "./student-file";
import { checkStudentFile, type UploadedFile } from "./student-file-check";
import type { InputContext } from "./student-input";
import { sourceName } from "./uploaded-file";

const NOTHING_TO_SAVE = {
  ok: false,
  error:
    "Tidak ada baris yang bisa disimpan. Periksa berkas, lalu unggah lagi.",
} as const;

export interface SavedFile {
  saved: number;
  /** The file as it was at the save, for the rows that were skipped. */
  preview: FilePreview;
}

function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

/** What the screen says after a file is saved. */
export function savedMessage(fileName: string, result: SavedFile): string {
  const saved = `${shown(result.saved)} baris dari ${sourceName(fileName)} tersimpan.`;
  const skipped = result.preview.broken + result.preview.registered;
  if (skipped === 0) return saved;
  return `${saved} ${shown(skipped)} baris dilewati.`;
}

/**
 * Saves the ready rows of a sent file as students, each with an account,
 * as the form does. The file is read and checked here from the start: what
 * the screen showed before is not trusted. A student who is already there
 * is never changed.
 */
export async function saveStudentFile(
  db: Database,
  actor: Actor,
  file: UploadedFile,
  context: InputContext,
): Promise<Parsed<SavedFile>> {
  if (!may(actor.roles, "input_new_students")) return NOT_ALLOWED;
  const rows = await checkStudentFile(db, file, context);
  if (!rows.ok) return rows;
  const { ready } = rows.value;
  if (ready.length === 0) return NOTHING_TO_SAVE;

  const input = {
    inputAt: new Date(),
    inputBy: actor.id,
    inputSource: uploadSource(sourceName(file.name)),
  };
  const added = await addStudents(
    db,
    ready.map(({ student }) => ({ ...student, ...input })),
    actor.id,
  );
  if (added.length === 0) return NOTHING_TO_SAVE;

  // A NIM taken between the check and the save was left out by the database.
  const saved = new Set(added.map((student) => student.nim));
  const nims = ready.map((row) => row.student.nim);
  const takenSince = new Set(nims.filter((nim) => !saved.has(nim)));
  const result = skipRegistered(rows.value, takenSince);
  return {
    ok: true,
    value: {
      saved: added.length,
      preview: previewOf(result, context.programs),
    },
  };
}
