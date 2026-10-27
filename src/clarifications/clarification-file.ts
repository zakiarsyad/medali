import type { FileFault, FileRule } from "@/files/file-check";
import { JPEG, PDF, PNG } from "@/files/file-kinds";

/*
 * The file a clarification takes, the same for every area that takes
 * clarifications. Read by the forms in the browser, so nothing here may
 * take from the database code: that would send it to the browser with
 * the form.
 */

const MEGABYTE = 1024 * 1024;

/**
 * The largest file of a clarification, picked or sent. A PDF is sent as
 * it is, so this stays below what the preview hosting takes in one send.
 */
export const CLARIFICATION_FILE_MAX_BYTES = 4 * MEGABYTE;

export const FILE_MISSING = "Lampirkan dokumen pendukung.";
export const FILE_WRONG_KIND = "Lampiran harus berupa PDF atau gambar.";
export const FILE_TOO_LARGE = "Ukuran lampiran maksimal 4 MB.";

/**
 * What the server takes as the file of a clarification. Other kinds of
 * picture are left out: some of them can carry code.
 */
export const CLARIFICATION_FILE_RULE: FileRule = {
  kinds: [PDF, JPEG, PNG],
  maxBytes: CLARIFICATION_FILE_MAX_BYTES,
};

/** What the screen says for each thing wrong with a sent file. */
export const CLARIFICATION_FILE_FAULTS: Record<FileFault, string> = {
  "wrong-kind": FILE_WRONG_KIND,
  empty: FILE_MISSING,
  "too-large": FILE_TOO_LARGE,
  "wrong-content": FILE_WRONG_KIND,
};
