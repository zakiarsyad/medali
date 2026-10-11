import type { Parsed } from "@/parsed";
import { MAX_FILE_BYTES } from "./student-file-columns";

const CSV_NAME = /\.csv$/i;
/** A spreadsheet file renamed to .csv holds this; CSV text never does. */
const NOT_TEXT = "\u0000";
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
  if (!CSV_NAME.test(name)) return NOT_CSV;
  if (bytes === 0) return EMPTY;
  if (bytes > MAX_FILE_BYTES) return TOO_LARGE;
  return null;
}

/** The text of a file, refused when what it holds is not text. */
export function readFileText(bytes: Uint8Array): Parsed<string> {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return { ok: false, error: UNREADABLE };
  }
  if (text.includes(NOT_TEXT)) return { ok: false, error: NOT_CSV };
  return { ok: true, value: text };
}

/**
 * A file name as it is kept with a student and shown in the list: on one
 * line, without characters that are not for showing, and short.
 */
export function sourceName(fileName: string): string {
  const oneLine = fileName.replace(UNSHOWN, " ").replace(/\s+/g, " ").trim();
  return oneLine.slice(0, SOURCE_NAME_MAX_LENGTH).trim();
}
