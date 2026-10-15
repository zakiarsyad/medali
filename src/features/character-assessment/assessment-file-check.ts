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
  type AssessmentFileRows,
  assessmentFileRows,
  type FileStudent,
  fileNims,
  readAssessmentFile,
} from "./assessment-file";
import {
  type AssessmentFilePreview,
  assessmentPreviewOf,
} from "./assessment-file-preview";
import { NOT_ALLOWED_TO_ASSESS } from "./assessment-messages";

/** The students an account may assess, as the form limits them. */
export function assessableBy(actor: AccountForAccess): SQL {
  return visibleTo(rowLimitForAction(actor, "assess_character"));
}

/**
 * The students a file names, by NIM, with whether each is Aktif, in one
 * read for the whole file. A removed student and one the account may
 * not assess are left out: the file names nobody it knows.
 */
async function readFileStudents(
  db: Database,
  assessable: SQL,
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
    .where(and(inArray(students.nim, nims), NOT_REMOVED, assessable));
  for (const { nim, ...student } of rows) known.set(nim, student);
  return known;
}

/**
 * Reads a sent assessment file from the start and decides, row by row,
 * ready or skipped. `assessable` is the students the account may
 * assess. Saves nothing, and keeps nothing of the file.
 */
export async function checkAssessmentFile(
  db: Database,
  assessable: SQL,
  file: SentFile,
): Promise<Parsed<AssessmentFileRows>> {
  const wrongShape = checkFileShape(file.name, file.bytes.length);
  if (wrongShape) return { ok: false, error: wrongShape };
  const text = readFileText(file.bytes);
  if (!text.ok) return text;
  const lines = readAssessmentFile(text.value);
  if (!lines.ok) return lines;
  const known = await readFileStudents(db, assessable, fileNims(lines.value));
  return { ok: true, value: assessmentFileRows(lines.value, known) };
}

/**
 * What a file would do if it were saved now, for an account with the
 * right Asesmen karakter. Saves nothing.
 */
export async function previewAssessmentFile(
  db: Database,
  actor: AccountForAccess,
  file: SentFile,
): Promise<Parsed<AssessmentFilePreview>> {
  if (!may(actor.roles, "assess_character")) return NOT_ALLOWED_TO_ASSESS;
  const rows = await checkAssessmentFile(db, assessableBy(actor), file);
  if (!rows.ok) return rows;
  return { ok: true, value: assessmentPreviewOf(rows.value) };
}
