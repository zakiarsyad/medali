import { and, inArray, type SQL, sql } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { NOT_REMOVED, visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { checkFileShape, readFileText } from "@/files/csv-file";
import type { SentFile } from "@/files/file-check";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import type { Parsed } from "@/parsed";
import {
  type FileStudent,
  fileNims,
  readSikuFile,
  type SikuFileRows,
  sikuFileRows,
} from "./siku-file";
import { type SikuFilePreview, sikuPreviewOf } from "./siku-file-preview";
import { NOT_ALLOWED_TO_ADJUST } from "./siku-messages";
import { savedBefore, uploadMarkOf } from "./siku-uploads";

/** The students an account may give SIKU to: those it sees on Penilaian SIKU. */
export function sikuVisibleTo(actor: AccountForAccess): SQL {
  return visibleTo(rowLimitForAction(actor, "view_siku"));
}

/**
 * The students a file names, by NIM, with whether each is Aktif and seen
 * by the account. A removed student is left out: the file names nobody.
 */
async function readFileStudents(
  db: Database,
  visible: SQL,
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
      visible: sql<boolean>`coalesce((${visible}), false)`,
    })
    .from(students)
    .where(and(inArray(students.nim, nims), NOT_REMOVED));
  for (const { nim, ...student } of rows) known.set(nim, student);
  return known;
}

/**
 * Reads a sent SIKU file from the start and decides, row by row, ready or
 * skipped. `visible` is the students the account may see. Saves nothing,
 * and keeps nothing of the file.
 */
export async function checkSikuFile(
  db: Database,
  visible: SQL,
  file: SentFile,
): Promise<Parsed<SikuFileRows>> {
  const wrongShape = checkFileShape(file.name, file.bytes.length);
  if (wrongShape) return { ok: false, error: wrongShape };
  const text = readFileText(file.bytes);
  if (!text.ok) return text;
  const lines = readSikuFile(text.value);
  if (!lines.ok) return lines;
  const known = await readFileStudents(db, visible, fileNims(lines.value));
  return { ok: true, value: sikuFileRows(lines.value, known) };
}

/**
 * What a file would do if it were saved now, for an account with the
 * right Penilaian SIKU. Saves nothing.
 */
export async function previewSikuFile(
  db: Database,
  actor: AccountForAccess,
  file: SentFile,
): Promise<Parsed<SikuFilePreview>> {
  if (!may(actor.roles, "adjust_siku")) return NOT_ALLOWED_TO_ADJUST;
  const rows = await checkSikuFile(db, sikuVisibleTo(actor), file);
  if (!rows.ok) return rows;
  const savedOn = await savedBefore(db, uploadMarkOf(file));
  return { ok: true, value: sikuPreviewOf(rows.value, savedOn) };
}
