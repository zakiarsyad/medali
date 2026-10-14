import {
  CLARIFICATION_FILE_FAULTS,
  CLARIFICATION_FILE_RULE,
  FILE_MISSING,
} from "@/clarifications/clarification-file";
import { shapeFault } from "@/files/file-check";
import { JPEG } from "@/files/file-kinds";

/*
 * What a clarification must hold before it is sent, checked in the
 * browser to answer at once and again on the server. Read by the form in
 * the browser, so nothing here may take from the database code.
 */

export const EXPLANATION_MIN = 10;
export const EXPLANATION_MAX = 1000;

export const EXPLANATION_TOO_SHORT = "Tulis penjelasan minimal satu kalimat.";
export const EXPLANATION_TOO_LONG = "Penjelasan paling banyak 1.000 karakter.";
export const REASON_MISSING = "Pilih alasan klarifikasi.";

/** The longest name of a file that is kept; a longer one is cut. */
export const FILE_NAME_MAX = 120;

/** What is wrong with an explanation, in words, or null. Spaces around it do not count. */
export function explanationFault(explanation: string): string | null {
  const length = explanation.trim().length;
  if (length < EXPLANATION_MIN) return EXPLANATION_TOO_SHORT;
  if (length > EXPLANATION_MAX) return EXPLANATION_TOO_LONG;
  return null;
}

/** A picked file, as far as it is known before it is read. */
export interface PickedFile {
  name: string;
  size: number;
}

/**
 * What is wrong with the name or the size of a file, in words, or null.
 * `file` is null when none was picked.
 */
export function pickedFileFault(file: PickedFile | null): string | null {
  if (file === null) return FILE_MISSING;
  const fault = shapeFault(
    nameToSend(file.name),
    file.size,
    CLARIFICATION_FILE_RULE,
  );
  return fault === null ? null : CLARIFICATION_FILE_FAULTS[fault];
}

/** A camera names a JPEG picture either way; the app keeps one of them. */
const LONG_JPEG_ENDING = /\.jpeg$/i;

function nameToSend(name: string): string {
  return name.replace(LONG_JPEG_ENDING, JPEG.extension);
}

const PICTURE_ENDING = /\.(jpg|jpeg|png)$/i;

/** Whether a file is a picture by its name, so the browser makes it smaller. */
export function isPictureName(name: string): boolean {
  return PICTURE_ENDING.test(name);
}

/** The name a picture gets once it was made smaller: it is a JPEG then. */
export function shrunkName(name: string): string {
  return name.replace(PICTURE_ENDING, JPEG.extension);
}

const PATH_BEFORE_NAME = /^.*[\\/]/;
/** Letters that end a line or steer a screen: no file name needs one. */
const CONTROL_LETTERS = /\p{Cc}/gu;

/**
 * The name a sent file is kept under: without a folder before it and
 * without letters that steer a screen, and cut at the front when it is
 * too long, so its ending stays.
 */
export function keptFileName(name: string): string {
  const plain = name.replace(PATH_BEFORE_NAME, "").replace(CONTROL_LETTERS, "");
  return plain.slice(-FILE_NAME_MAX).trim();
}
