import type { Database } from "@/db/connect";
import type { FileStore } from "@/files/file-store";
import { keepFile } from "@/files/keep-file";
import type { Parsed } from "@/parsed";
import type { AddedStudent } from "./add-student";
import {
  addStudentBatch,
  type BatchFile,
  type NewBatch,
} from "./add-student-batch";
import type { UploadedFile } from "./student-file-check";
import { FAULT_MESSAGES, STUDENT_FILE_RULE, shortLine } from "./uploaded-file";

const FOLDER = "student-files";
const FILE_NAME_MAX_LENGTH = 255;

export const FILE_NOT_KEPT = {
  ok: false,
  error: "Berkas tidak dapat disimpan. Coba lagi.",
} as const;

/**
 * Puts a student file in the file storage, checked once more on the way.
 * A storage that fails or cannot be reached is not an error to pass on:
 * the person is told to try again, and the cause is logged, which names
 * no person and no key.
 */
async function keepStudentFile(
  store: FileStore,
  file: UploadedFile,
): Promise<Parsed<BatchFile>> {
  try {
    const kept = await keepFile(store, FOLDER, file, STUDENT_FILE_RULE);
    if (!kept.ok) return { ok: false, error: FAULT_MESSAGES[kept.fault] };
    return {
      ok: true,
      value: {
        objectKey: kept.key,
        fileName: shortLine(file.name, FILE_NAME_MAX_LENGTH),
        byteSize: file.bytes.length,
        contentType: kept.contentType,
      },
    };
  } catch (error) {
    console.error("A student file was not kept.", error);
    return FILE_NOT_KEPT;
  }
}

/**
 * Removes a kept file that got no batch. When the storage fails here too
 * the save is not made to fail for it: the file stays, unreachable by
 * anyone, and the log says which one.
 */
async function dropStudentFile(
  store: FileStore,
  objectKey: string,
): Promise<void> {
  try {
    await store.remove(objectKey);
  } catch (error) {
    console.error(`The kept file ${objectKey} has no batch.`, error);
  }
}

/**
 * Keeps a student file and saves its students, together or not at all.
 * The file goes to the file storage first, so a storage that cannot be
 * reached saves no student. Then a kept file always has its batch: when
 * the save fails, or finds no student to add, the file is removed again.
 */
export async function addStudentsWithFile(
  db: Database,
  store: FileStore,
  file: UploadedFile,
  batch: Omit<NewBatch, "file">,
): Promise<Parsed<AddedStudent[]>> {
  const kept = await keepStudentFile(store, file);
  if (!kept.ok) return kept;

  let added: AddedStudent[] = [];
  try {
    added = await addStudentBatch(db, { ...batch, file: kept.value });
  } finally {
    if (added.length === 0) {
      await dropStudentFile(store, kept.value.objectKey);
    }
  }
  return { ok: true, value: added };
}
