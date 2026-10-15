/*
 * What a reduction of a dorm violation and its undoing answer. Read by
 * the screen parts in the browser, so nothing here may take from the
 * database code.
 */

function refusal(error: string) {
  return { ok: false, error } as const;
}

export const REDUCE_NOT_ALLOWED = refusal(
  "Anda tidak berhak mengurangi pelanggaran atau membatalkan pengurangannya. Keduanya dilakukan oleh Pengelola Asrama.",
);

/** A violation that is not there, not seen, or not of the student named. */
export const REDUCED_NOT_FOUND = refusal(
  "Pelanggaran yang dipilih tidak ditemukan. Muat ulang halaman.",
);

export const ALREADY_REDUCED = refusal(
  "Pelanggaran yang dipilih sudah dikurangi. Muat ulang halaman.",
);

/** Waiting for its announcement, in Masa advokasi, its appeal waiting or accepted, or cancelled. */
export const NOT_ESCALATED = refusal(
  "Hanya pelanggaran yang sudah naik ke Pengelola Asrama yang dapat dikurangi. Muat ulang halaman.",
);

export const OWN_REDUCTION = refusal(
  "Pengurangan pelanggaran atas diri Anda sendiri dilakukan atau dibatalkan oleh Pengelola Asrama yang lain.",
);

export const ALREADY_UNDONE = refusal(
  "Pengurangan ini sudah dibatalkan. Muat ulang halaman.",
);

export const NONE_PICKED = refusal("Pilih pelanggaran yang akan dikurangi.");

export const TOO_MANY_PICKED = refusal(
  "Terlalu banyak pelanggaran dipilih sekaligus. Kurangi sebagian dulu, lalu sisanya.",
);
