/*
 * What sending a clarification of a dorm absence answers. Read by the
 * screen parts in the browser, so nothing here may take from the
 * database code.
 */

function refusal(error: string) {
  return { ok: false, error } as const;
}

export const ASK_NOT_ALLOWED = refusal(
  "Anda tidak berhak mengajukan klarifikasi.",
);

/** An activity that is unknown, or a day it was not counted on. */
export const ABSENCE_NOT_FOUND = refusal(
  "Kegiatan ini tidak ditemukan. Muat ulang halaman.",
);

export const NOT_TO_CLARIFY = refusal(
  "Klarifikasi hanya untuk kegiatan asrama yang sudah selesai dan tercatat tidak hadir.",
);

export const CLARIFICATION_CLOSED = refusal("Batas klarifikasi sudah lewat.");

/** Said where file keeping is off: on a preview without file storage. */
export const NO_FILE_STORAGE = refusal(
  "Lampiran belum dapat disimpan di sini karena penyimpanan berkas belum diatur. Tidak ada yang tersimpan.",
);

export const FILE_NOT_KEPT = refusal(
  "Lampiran tidak dapat disimpan. Coba lagi.",
);

export const CLARIFICATION_SENT = "Klarifikasi terkirim.";
