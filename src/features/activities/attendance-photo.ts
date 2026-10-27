import type { FileFault, FileRule } from "@/files/file-check";
import { JPEG } from "@/files/file-kinds";

/*
 * Read by the upload in the browser, so nothing here may take from the
 * database code: that would send it to the browser with the upload.
 */

const MEGABYTE = 1024 * 1024;

/** The largest photo a student may pick, before it is made smaller. */
export const PICKED_PHOTO_MAX_BYTES = 8 * MEGABYTE;

/**
 * The largest photo the server takes. The upload makes every picked photo
 * a JPEG 1,280 dots on its longest side, far smaller than this, and this
 * stays below what the preview hosting takes in one send.
 */
export const SENT_PHOTO_MAX_BYTES = 4 * MEGABYTE;

export const NOT_A_PICTURE = "Berkas harus berupa gambar.";
export const PHOTO_TOO_LARGE = "Ukuran foto maksimal 8 MB.";
const SENT_PHOTO_TOO_LARGE = "Foto terlalu besar. Pilih foto lain.";

/**
 * What the server takes as an attendance photo. The upload makes every
 * picked picture smaller and sends it as a JPEG, so that is the one kind.
 */
export const PHOTO_RULE: FileRule = {
  kinds: [JPEG],
  maxBytes: SENT_PHOTO_MAX_BYTES,
};

/** The part of the file storage that keeps the attendance photos. */
export const PHOTO_FOLDER = "attendance-photos";

/** The name every sent photo gets: the name of the picked file is not kept. */
export const PHOTO_FILE_NAME = `foto-kehadiran${JPEG.extension}`;

/** What the screen says for each thing wrong with a sent photo. */
export const PHOTO_FAULTS: Record<FileFault, string> = {
  "wrong-kind": NOT_A_PICTURE,
  empty: NOT_A_PICTURE,
  "too-large": SENT_PHOTO_TOO_LARGE,
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
  if (bytes > PICKED_PHOTO_MAX_BYTES) return PHOTO_TOO_LARGE;
  return null;
}
