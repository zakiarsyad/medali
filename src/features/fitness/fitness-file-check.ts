import { and, inArray, type SQL, sql } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { NOT_REMOVED, visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { checkFileShape, readFileText } from "@/files/csv-file";
import type { SentFile } from "@/files/file-check";
import { readFitnessLimits } from "@/health-notes/fitness-limits";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import type { Parsed } from "@/parsed";
import {
  type FileStudent,
  type FitnessFileRows,
  fileNims,
  fitnessFileRows,
  readFitnessFile,
} from "./fitness-file";
import {
  type FitnessFilePreview,
  fitnessPreviewOf,
} from "./fitness-file-preview";
import { NOT_ALLOWED_TO_ENTER } from "./save-fitness-scores";

/** The students an account may enter fitness scores for. */
export function scorableBy(actor: AccountForAccess): SQL {
  return visibleTo(rowLimitForAction(actor, "enter_fitness_scores"));
}

/**
 * The students a file names, by NIM, with whether each is Aktif, in one
 * read for the whole file. A removed student and one the account may
 * not enter scores for are left out: the file names nobody it knows.
 */
async function readFileStudents(
  db: Database,
  scorable: SQL,
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
    .where(and(inArray(students.nim, nims), NOT_REMOVED, scorable));
  for (const { nim, ...student } of rows) known.set(nim, student);
  return known;
}

/**
 * Reads a sent fitness file from the start and decides, row by row,
 * ready or skipped. `scorable` is the students the account may enter
 * scores for. Saves nothing, and keeps nothing of the file.
 */
export async function checkFitnessFile(
  db: Database,
  scorable: SQL,
  file: SentFile,
): Promise<Parsed<FitnessFileRows>> {
  const wrongShape = checkFileShape(file.name, file.bytes.length);
  if (wrongShape) return { ok: false, error: wrongShape };
  const text = readFileText(file.bytes);
  if (!text.ok) return text;
  const lines = readFitnessFile(text.value);
  if (!lines.ok) return lines;
  const known = await readFileStudents(db, scorable, fileNims(lines.value));
  return { ok: true, value: fitnessFileRows(lines.value, known) };
}

/**
 * What a file would do if it were saved now, with the category each
 * score gives by the limits in force, for an account with the right
 * "Penilaian jasmani". Saves nothing.
 */
export async function previewFitnessFile(
  db: Database,
  actor: AccountForAccess,
  file: SentFile,
): Promise<Parsed<FitnessFilePreview>> {
  if (!may(actor.roles, "enter_fitness_scores")) return NOT_ALLOWED_TO_ENTER;
  const rows = await checkFitnessFile(db, scorableBy(actor), file);
  if (!rows.ok) return rows;
  const { limits } = await readFitnessLimits(db);
  return { ok: true, value: fitnessPreviewOf(rows.value, limits) };
}
