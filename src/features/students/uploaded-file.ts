import { type FileFault, type FileRule, shapeFault } from "@/files/file-check";
import { CSV, readText } from "@/files/file-kinds";
import type { Parsed } from "@/parsed";
import { MAX_FILE_BYTES } from "./student-file-columns";

/** A student file is CSV only, and no larger than the template says. */
export const STUDENT_FILE_RULE: FileRule = {
  kinds: [CSV],
  maxBytes: MAX_FILE_BYTES,
};

const SOURCE_NAME_MAX_LENGTH = 60;
/** Line breaks, tabs and the other characters that are not for showing. */
const UNSHOWN = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu;

const NOT_CSV =
  "Berkas harus berformat CSV. Simpan berkas sebagai CSV sesuai templat, lalu unggah lagi.";
const TOO_LARGE =
  "Ukuran berkas lebih dari 1 MB. Bagi menjadi beberapa berkas, lalu unggah satu per satu.";
const EMPTY = "Berkas kosong. Isi berkas sesuai templat, lalu unggah lagi.";
const UNREADABLE =
  "Berkas tidak bisa dibaca. Simpan berkas sebagai CSV UTF-8 sesuai templat, lalu unggah lagi.";

/**
 * Checks the name and the size of a picked file before it is read: in the
 * browser, to answer at once, and again on the server, which trusts
 * nothing the browser sends. Gives what is wrong, or null.
 */
export function checkFileShape(name: string, bytes: number): string | null {
  const fault = shapeFault(name, bytes, STUDENT_FILE_RULE);
  return fault ? FAULT_MESSAGES[fault] : null;
}

/** What the screen says for each thing wrong with a student file. */
export const FAULT_MESSAGES: Record<FileFault, string> = {
  "wrong-kind": NOT_CSV,
  empty: EMPTY,
  "too-large": TOO_LARGE,
  "wrong-content": NOT_CSV,
};

/** The text of a file, refused when what it holds is not text. */
export function readFileText(bytes: Uint8Array): Parsed<string> {
  const read = readText(bytes);
  if (read.ok) return { ok: true, value: read.text };
  if (read.fault === "not-utf8") return { ok: false, error: UNREADABLE };
  return { ok: false, error: NOT_CSV };
}

/**
 * A text from outside as it is shown: on one line, without characters
 * that are not for showing, and no longer than asked.
 */
export function shortLine(text: string, maxLength: number): string {
  const oneLine = text.replace(UNSHOWN, " ").replace(/\s+/g, " ").trim();
  return oneLine.slice(0, maxLength).trim();
}

/** A file name as it is kept with a student and shown in the list. */
export function sourceName(fileName: string): string {
  return shortLine(fileName, SOURCE_NAME_MAX_LENGTH);
}
