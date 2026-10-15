/*
 * What scheduling a call and issuing a warning letter of the dorm answer.
 * Read by the screen parts in the browser, so nothing here may take from
 * the database code.
 */

function refusal(error: string) {
  return { ok: false, error } as const;
}

export const WARNING_NOT_ALLOWED = refusal(
  "Anda tidak berhak menjadwalkan panggilan klarifikasi atau menerbitkan SP. Keduanya dilakukan oleh Pengelola Asrama.",
);

/** A student who is not there, not seen, or not called for an SP now. */
export const NOT_CALLED = refusal(
  "Mahasiswa ini tidak sedang dalam panggilan klarifikasi. Muat ulang halaman.",
);

/** The SP the form was for is not the one the student is called for now. */
export const CALL_CHANGED = refusal(
  "Panggilan mahasiswa ini sudah berubah. Muat ulang halaman.",
);

export const ALREADY_ISSUED = refusal(
  "SP ini sudah diterbitkan dan tidak dapat diubah. Muat ulang halaman.",
);

export const OWN_CALL = refusal(
  "Panggilan dan SP atas diri Anda sendiri diproses oleh Pengelola Asrama yang lain.",
);

export const CALL_SENT = "Panggilan klarifikasi dikirim ke mahasiswa.";
export const CALL_MOVED = "Jadwal klarifikasi diubah.";
export const SP1_ISSUED = "SP 1 terbit.";
export const SP2_ISSUED =
  "SP 2 terbit dan hukuman disiplin diajukan ke Kepala UPK.";
