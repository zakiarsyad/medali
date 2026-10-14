import { and, inArray, isNull } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { accounts, students } from "@/db/schema";
import { checkFileShape, readFileText } from "@/files/csv-file";
import type { Parsed } from "@/parsed";
import { type FilePreview, previewOf } from "./file-preview";
import { type Actor, NOT_ALLOWED } from "./input-student";
import {
  type FileRows,
  readStudentFile,
  skipRegistered,
  skipUsedEmails,
} from "./student-file";
import type { InputContext } from "./student-input";

/** A file as the browser sends it: nothing in it is trusted. */
export interface UploadedFile {
  name: string;
  bytes: Uint8Array;
}

/**
 * Which of these NIMs a student already has. A removed student counts:
 * the record is kept, so the NIM stays taken.
 */
async function registeredAmong(
  db: Database,
  nims: string[],
): Promise<Set<string>> {
  if (nims.length === 0) return new Set();
  const found = await db
    .select({ nim: students.nim })
    .from(students)
    .where(inArray(students.nim, nims));
  return new Set(found.map((student) => student.nim));
}

/**
 * Which of these addresses an account holds. A removed account does not
 * count: its address is free again, as the database's rule has it.
 */
async function emailsInUseAmong(
  db: Database,
  emails: string[],
): Promise<Set<string>> {
  if (emails.length === 0) return new Set();
  const found = await db
    .select({ email: accounts.email })
    .from(accounts)
    .where(and(inArray(accounts.email, emails), isNull(accounts.deletedAt)));
  return new Set(found.flatMap(({ email }) => (email === null ? [] : [email])));
}

function emailsOf(rows: FileRows): string[] {
  return rows.ready.flatMap(({ student }) =>
    student.email === null ? [] : [student.email],
  );
}

/**
 * Reads a sent file from the start and decides, row by row, ready or
 * skipped. Saves nothing, and keeps nothing of the file. A row whose NIM
 * is registered is set apart first, so its address takes none away from
 * a row that can be saved.
 */
export async function checkStudentFile(
  db: Database,
  file: UploadedFile,
  context: InputContext,
): Promise<Parsed<FileRows>> {
  const wrongShape = checkFileShape(file.name, file.bytes.length);
  if (wrongShape) return { ok: false, error: wrongShape };
  const text = readFileText(file.bytes);
  if (!text.ok) return text;
  const rows = readStudentFile(text.value, context);
  if (!rows.ok) return rows;

  const nims = rows.value.ready.map((row) => row.student.nim);
  const registered = await registeredAmong(db, nims);
  const unregistered = skipRegistered(rows.value, registered);
  const inUse = await emailsInUseAmong(db, emailsOf(unregistered));
  return { ok: true, value: skipUsedEmails(unregistered, inUse) };
}

/** What a file would do if it were saved now. Saves nothing. */
export async function previewStudentFile(
  db: Database,
  actor: Actor,
  file: UploadedFile,
  context: InputContext,
): Promise<Parsed<FilePreview>> {
  if (!may(actor.roles, "input_new_students")) return NOT_ALLOWED;
  const rows = await checkStudentFile(db, file, context);
  if (!rows.ok) return rows;
  return { ok: true, value: previewOf(rows.value, context.programs) };
}
