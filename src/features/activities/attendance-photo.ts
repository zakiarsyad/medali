import type { FileFault, FileRule } from "@/files/file-check";
import { JPEG } from "@/files/file-kinds";

/*
 * Read by the upload in the browser, so nothing here may take from the
 * database code: that would send it to the browser with the upload.
 */

const MEGABYTE = 1024 * 1024;

/** The largest photo, picked or sent. */
export const PHOTO_MAX_BYTES = 8 * MEGABYTE;

export const NOT_A_PICTURE = "Berkas harus berupa gambar.";
export const PHOTO_TOO_LARGE = "Ukuran foto maksimal 8 MB.";

/**
 * What the server takes as an attendance photo. The upload makes every
 * picked picture smaller and sends it as a JPEG, so that is the one kind.
 */
export const PHOTO_RULE: FileRule = {
  kinds: [JPEG],
  maxBytes: PHOTO_MAX_BYTES,
};

/** The name every sent photo gets: the name of the picked file is not kept. */
export const PHOTO_FILE_NAME = `foto-kehadiran${JPEG.extension}`;

/** What the screen says for each thing wrong with a sent photo. */
export const PHOTO_FAULTS: Record<FileFault, string> = {
  "wrong-kind": NOT_A_PICTURE,
  empty: NOT_A_PICTURE,
  "too-large": PHOTO_TOO_LARGE,
  "wrong-content": NOT_A_PICTURE,
};

/**
 * Checks a picked file before it is made smaller: the kind its browser
 * says it is, and its size. Gives what is wrong in words, or null. The
 * server checks what is sent again.
 */
export function pickedPhotoFault(type: string, bytes: number): string | null {
  if (!type.startsWith("image/")) return NOT_A_PICTURE;
  if (bytes === 0) return NOT_A_PICTURE;
  if (bytes > PHOTO_MAX_BYTES) return PHOTO_TOO_LARGE;
  return null;
}
