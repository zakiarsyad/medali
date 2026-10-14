/*
 * What the server answers about requests for a SIKU gain. Read by the
 * screens in the browser too, so nothing here may take from the database
 * code.
 */

function refusal(error: string) {
  return { ok: false, error } as const;
}

export const REQUEST_SENT =
  "Pengajuan terkirim. Penilai Mahasiswa akan memeriksanya.";

export const ASK_NOT_ALLOWED = refusal(
  "Anda tidak berhak mengajukan penambahan SIKU.",
);

/** Gains are given to Aktif students only, so only they may ask for one. */
export const NOT_AN_ACTIVE_STUDENT = refusal(
  "Pengajuan penambahan SIKU hanya untuk mahasiswa berstatus Aktif.",
);

/** What a request answers when its key is that of another request. */
export const REQUEST_ALREADY_SENT = refusal(
  "Formulir ini sudah pernah terkirim. Muat ulang halaman, lalu periksa Pengajuan saya.",
);

/** Said where file keeping is off: on a preview without file storage. */
export const NO_PHOTO_STORAGE = refusal(
  "Foto bukti belum dapat disimpan di sini karena penyimpanan berkas belum diatur. Tidak ada yang tersimpan.",
);

export const REQUEST_WITHDRAWN = "Pengajuan ditarik.";

export const REQUEST_NOT_FOUND = refusal(
  "Pengajuan ini tidak ditemukan. Muat ulang halaman.",
);

/** What a withdrawal answers once the request was decided, as at the same moment. */
export const ALREADY_DECIDED = refusal(
  "Pengajuan ini sudah diperiksa Penilai Mahasiswa, jadi tidak dapat ditarik. Muat ulang halaman.",
);

export const DECIDE_NOT_ALLOWED = refusal(
  "Anda tidak berhak memutuskan pengajuan penambahan SIKU. Pengajuan diperiksa oleh Penilai Mahasiswa.",
);

/** What a decision answers for a request that is not there, or was withdrawn. */
export const REQUEST_GONE = refusal(
  "Pengajuan ini tidak ditemukan atau sudah ditarik mahasiswa. Muat ulang halaman.",
);

/** What a decision answers once another decision was saved first. */
export const DECIDED_BEFORE = refusal(
  "Pengajuan ini sudah diputuskan. Muat ulang halaman untuk melihat hasilnya.",
);

/** Gains go to Aktif students only, so a request of one who left is not approved. */
export const STUDENT_NOT_ACTIVE = refusal(
  "Mahasiswa ini tidak berstatus Aktif lagi, jadi pengajuan tidak dapat disetujui. Tolak dengan catatan bila perlu.",
);

export const PHOTOS_NOT_KEPT = refusal(
  "Foto bukti tidak dapat disimpan. Coba lagi.",
);
