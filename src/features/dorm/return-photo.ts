import type { FileFault, FileRule } from "@/files/file-check";
import { JPEG } from "@/files/file-kinds";

/*
 * The photo of a report of a return from leave. Read by the camera in
 * the browser, so nothing here may take from the database code.
 */

const MEGABYTE = 1024 * 1024;

/** The largest photo the server takes. */
export const RETURN_PHOTO_MAX_BYTES = 8 * MEGABYTE;

/**
 * What the server takes as the photo of a report. The camera on the page
 * draws what it sees as a JPEG, so that is the one kind.
 */
export const RETURN_PHOTO_RULE: FileRule = {
  kinds: [JPEG],
  maxBytes: RETURN_PHOTO_MAX_BYTES,
};

/** The part of the file storage that keeps the photos of the reports. */
export const RETURN_PHOTO_FOLDER = "return-photos";

/** The name every report photo gets. */
export const RETURN_PHOTO_FILE_NAME = `foto-lapor-kembali${JPEG.extension}`;

const NOT_A_PHOTO = "Foto tidak terbaca. Ambil foto lagi dengan kamera.";

/** What the screen says for each thing wrong with a sent photo. */
export const RETURN_PHOTO_FAULTS: Record<FileFault, string> = {
  "wrong-kind": NOT_A_PHOTO,
  empty: NOT_A_PHOTO,
  "too-large": "Ukuran foto maksimal 8 MB. Ambil foto lagi.",
  "wrong-content": NOT_A_PHOTO,
};
