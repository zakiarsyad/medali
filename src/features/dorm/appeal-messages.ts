import { APPEAL_HOURS } from "./violation-ids";

/*
 * What sending and deciding an appeal of a dorm violation answer. Read
 * by the screen parts in the browser, so nothing here may take from the
 * database code.
 */

function refusal(error: string) {
  return { ok: false, error } as const;
}

export const APPEAL_NOT_ALLOWED = refusal(
  "Anda tidak berhak mengajukan advokasi. Advokasi diajukan oleh penghuni asrama atas pelanggarannya sendiri.",
);

/** A violation that is not there, not the resident's own, or not announced yet. */
export const APPEAL_VIOLATION_NOT_FOUND = refusal(
  "Pelanggaran ini tidak ditemukan. Muat ulang halaman.",
);

export const APPEAL_TIME_OVER = refusal(
  `Batas waktu advokasi ${APPEAL_HOURS} jam sudah lewat.`,
);

export const ALREADY_APPEALED = refusal(
  "Pelanggaran ini sudah diajukan advokasi, dan advokasi tidak dapat diubah. Muat ulang halaman untuk melihat statusnya.",
);

/** Said where file keeping is off: on a preview without file storage. */
export const NO_PROOF_STORAGE = refusal(
  "Bukti belum dapat disimpan di sini karena penyimpanan berkas belum diatur. Tidak ada yang tersimpan; kirim tanpa bukti bila perlu.",
);

export const PROOF_NOT_KEPT = refusal("Bukti tidak dapat disimpan. Coba lagi.");

export const APPEAL_SENT =
  "Advokasi terkirim. Badan Asrama Mahasiswa akan memeriksanya.";
