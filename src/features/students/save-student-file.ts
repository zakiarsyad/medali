import { may } from "@/auth/access";
import type { Database } from "@/db/connect";
import type { FileStore } from "@/files/file-store";
import type { Parsed } from "@/parsed";
import type { AddedStudent } from "./add-student";
import { addStudentBatch, type NewBatch } from "./add-student-batch";
import { type FilePreview, previewOf } from "./file-preview";
import { type Actor, NOT_ALLOWED } from "./input-student";
import { dropStudentFile, keepStudentFile } from "./keep-student-file";
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
 * Saves a batch whose file is already in the file storage. A kept file
 * always has its batch: when the save fails, or finds no student to add,
 * the file is removed again.
 */
async function addBatchOrDropFile(
  db: Database,
  store: FileStore,
  batch: NewBatch,
): Promise<AddedStudent[]> {
  let added: AddedStudent[] = [];
  try {
    added = await addStudentBatch(db, batch);
  } finally {
    if (added.length === 0) {
      await dropStudentFile(store, batch.file.objectKey);
    }
  }
  return added;
}

/**
 * Saves the ready rows of a sent file as students, each with an account,
 * as the form does, and keeps the file with them. The file is read and
 * checked here from the start: what the screen showed before is not
 * trusted. A student who is already there is never changed.
 *
 * The file goes to the file storage first, so a storage that cannot be
 * reached saves no student. A file with no row to save is not kept.
 */
export async function saveStudentFile(
  db: Database,
  store: FileStore,
  actor: Actor,
  file: UploadedFile,
  context: InputContext,
): Promise<Parsed<SavedFile>> {
  if (!may(actor.roles, "input_new_students")) return NOT_ALLOWED;
  const rows = await checkStudentFile(db, file, context);
  if (!rows.ok) return rows;
  const { ready } = rows.value;
  if (ready.length === 0) return NOTHING_TO_SAVE;

  const kept = await keepStudentFile(store, file);
  if (!kept.ok) return kept;
  const input = {
    inputAt: new Date(),
    inputBy: actor.id,
    inputSource: uploadSource(sourceName(file.name)),
  };
  const added = await addBatchOrDropFile(db, store, {
    inputAt: input.inputAt,
    inputBy: actor.id,
    students: ready.map(({ student }) => ({ ...student, ...input })),
    file: kept.value,
  });
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
