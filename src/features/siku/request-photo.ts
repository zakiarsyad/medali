import type { FileFault, FileRule } from "@/files/file-check";
import { JPEG } from "@/files/file-kinds";

/*
 * The proof photos of a request for a SIKU gain. Read by the form in the
 * browser, so nothing here may take from the database code.
 */

const MEGABYTE = 1024 * 1024;

/** The largest photo a student may pick, before it is made smaller. */
export const PICKED_PHOTO_MAX_BYTES = 5 * MEGABYTE;

/**
 * The largest photo the server takes. The form makes every picked photo
 * a JPEG 1,280 dots on its longest side, far smaller than this, so three
 * fit in one request below what the hosting takes.
 */
export const SENT_PHOTO_MAX_BYTES = 1 * MEGABYTE;

/** The largest small copy the server takes, which the form makes too. */
export const SENT_THUMB_MAX_BYTES = 100 * 1024;

/** The longest side of the small copy shown on the cards and the list. */
export const THUMB_MAX_SIDE = 240;

/** What the server takes as a photo: the form sends JPEGs only. */
export const REQUEST_PHOTO_RULE: FileRule = {
  kinds: [JPEG],
  maxBytes: SENT_PHOTO_MAX_BYTES,
};

/** What the server takes as the small copy of a photo. */
export const REQUEST_THUMB_RULE: FileRule = {
  kinds: [JPEG],
  maxBytes: SENT_THUMB_MAX_BYTES,
};

/** The part of the file storage that keeps the photos of requests. */
export const REQUEST_PHOTO_FOLDER = "siku-request-photos";

/** The name every sent photo gets: the name of the picked file is not kept. */
export const REQUEST_PHOTO_FILE_NAME = `foto-bukti-siku${JPEG.extension}`;

export const ONLY_PICTURES = "Hanya berkas gambar yang diterima.";
export const TOO_MANY_PHOTOS = "Maksimal 3 foto.";
export const PHOTO_TOO_LARGE = "Ukuran foto maksimal 5 MB.";
export const NO_PHOTO = "Unggah minimal satu foto bukti kegiatan.";

const NOT_READ = "Foto tidak terbaca. Pilih foto lagi.";

/** What the screen says for each thing wrong with a sent photo. */
export const REQUEST_PHOTO_FAULTS: Record<FileFault, string> = {
  "wrong-kind": NOT_READ,
  empty: NOT_READ,
  "too-large": "Foto terlalu besar. Pilih foto lain.",
  "wrong-content": NOT_READ,
};
