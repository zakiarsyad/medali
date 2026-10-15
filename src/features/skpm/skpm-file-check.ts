import { and, inArray, sql } from "drizzle-orm";
import { type AccountForAccess, may } from "@/auth/access";
import { NOT_REMOVED } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { checkFileShape, readFileText } from "@/files/csv-file";
import type { SentFile } from "@/files/file-check";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import type { Parsed } from "@/parsed";
import {
  type FileStudent,
  fileNims,
  readSkpmFile,
  type SkpmFileRows,
  skpmFileRows,
} from "./skpm-file";
import { type SkpmFilePreview, skpmPreviewOf } from "./skpm-file-preview";
import { NOT_ALLOWED_TO_UPLOAD } from "./skpm-messages";

/**
 * The students a file names, by NIM, with whether each is Aktif. A
 * removed student is left out: the file names nobody.
 */
async function readFileStudents(
  db: Database,
  nims: string[],
): Promise<Map<string, FileStudent>> {
  const known = new Map<string, FileStudent>();
  if (nims.length === 0) return known;
  const rows = await db
    .select({
      id: students.id,
      nim: students.nim,
      name: students.name,
      active: sql<boolean>`(${ACTIVE_MEMBER})`,
    })
    .from(students)
    .where(and(inArray(students.nim, nims), NOT_REMOVED));
  for (const { nim, ...student } of rows) known.set(nim, student);
  return known;
}

/**
 * Reads a sent SKPM file from the start and decides, row by row, ready or
 * skipped. Saves nothing, and keeps nothing of the file.
 */
export async function checkSkpmFile(
  db: Database,
  file: SentFile,
): Promise<Parsed<SkpmFileRows>> {
  const wrongShape = checkFileShape(file.name, file.bytes.length);
  if (wrongShape) return { ok: false, error: wrongShape };
  const text = readFileText(file.bytes);
  if (!text.ok) return text;
  const lines = readSkpmFile(text.value);
  if (!lines.ok) return lines;
  const known = await readFileStudents(db, fileNims(lines.value));
  return { ok: true, value: skpmFileRows(lines.value, known) };
}

/**
 * What a file would do if it were saved now, for an account with the
 * right "Unggah data SKPM". Saves nothing.
 */
export async function previewSkpmFile(
  db: Database,
  actor: AccountForAccess,
  file: SentFile,
): Promise<Parsed<SkpmFilePreview>> {
  if (!may(actor.roles, "upload_skpm")) return NOT_ALLOWED_TO_UPLOAD;
  const rows = await checkSkpmFile(db, file);
  if (!rows.ok) return rows;
  return { ok: true, value: skpmPreviewOf(rows.value) };
}
