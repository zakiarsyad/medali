import type { ReportStatus } from "./leave-ids";

/*
 * What reporting back, and checking and recording a return, answer.
 * Read by the screen parts in the browser, so nothing here may take from
 * the database code.
 */

function refusal(error: string) {
  return { ok: false, error } as const;
}

export const REPORT_NOT_ALLOWED = refusal(
  "Anda tidak berhak melapor kembali ke asrama.",
);

export const REPORT_NOT_A_RESIDENT = refusal(
  "Lapor kembali hanya untuk mahasiswa yang tinggal di asrama.",
);

export const NEEDS_NO_REPORT = refusal(
  "ITMK tidak perlu lapor kembali ke asrama.",
);

export const LEAVE_NOT_APPROVED = refusal(
  "Lapor kembali hanya untuk izin yang disetujui.",
);

export const ALREADY_BACK = refusal(
  "Kepulangan dari izin ini sudah tercatat. Muat ulang halaman.",
);

/** What a report answers while a report of the same leave waits. */
export const REPORT_WAITS = refusal(
  "Laporan kembali untuk izin ini masih menunggu pemeriksaan, jadi foto ini tidak disimpan. Muat ulang halaman.",
);

/** What a report answers when its key is that of a report of another leave. */
export const REPORT_ALREADY_SENT = refusal(
  "Laporan ini sudah pernah terkirim. Muat ulang halaman, lalu periksa Riwayat izin saya.",
);

/** Said where file keeping is off: on a preview without file storage. */
export const NO_RETURN_PHOTO_STORAGE = refusal(
  "Foto belum dapat disimpan di sini karena penyimpanan berkas belum diatur. Tidak ada yang tersimpan.",
);

export const RETURN_PHOTO_NOT_KEPT = refusal(
  "Foto tidak dapat disimpan. Coba lagi.",
);

/** What a report answers before "Lapor kembali ke asrama" opens. */
export function reportNotOpen(opens: string) {
  return refusal(`Lapor kembali dibuka ${opens}.`);
}

/** What a kept report answers, on time or late. */
export function reportSentWords(lateMinutes: number): string {
  if (lateMinutes === 0) {
    return "Laporan kembali terkirim tepat waktu. Menunggu verifikasi BAM.";
  }
  return `Laporan kembali terkirim. Anda tercatat terlambat ${lateMinutes} menit. Menunggu verifikasi BAM.`;
}

export const REPORT_NOT_FOUND = refusal(
  "Laporan kembali ini tidak ditemukan. Muat ulang halaman.",
);

export const VERIFY_NOT_ALLOWED = refusal(
  "Anda tidak berhak memverifikasi laporan kembali ke asrama.",
);

export const VALIDATE_NOT_ALLOWED = refusal(
  "Anda tidak berhak memvalidasi laporan kembali ke asrama.",
);

export const NO_VERIFY_DECISION = refusal("Pilih Verifikasi atau Tolak.");

export const NO_VALIDATE_DECISION = refusal(
  "Pilih Validasi kembali atau Tolak.",
);

/** What Pengelola Asrama is told of a report that BAM - BPHK has not checked. */
export const STILL_WAITS_FOR_BAM = refusal(
  "Laporan ini masih menunggu verifikasi BAM, jadi belum dapat divalidasi. Muat ulang halaman nanti.",
);

/** What a decision on a report makes it. */
export type DecidedStatus = Exclude<ReportStatus, "waiting">;

/** How a decision that came first is named, by what it made the report. */
const DECIDED_WORDS: Record<DecidedStatus, string> = {
  verified: "diverifikasi BAM",
  rejected: "ditolak",
  validated: "divalidasi",
};

/** What a decision answers when the report was decided by someone else first. */
export function reportDecidedFirst(status: DecidedStatus) {
  return refusal(
    `Laporan ini sudah ${DECIDED_WORDS[status]} lebih dulu, jadi keputusan Anda tidak disimpan. Muat ulang halaman.`,
  );
}

/** What a kept decision on a report answers, by what it made the report. */
export const REPORT_DECIDED_WORDS: Record<DecidedStatus, string> = {
  verified: "Laporan kembali diverifikasi dan diteruskan ke Pengelola Asrama.",
  rejected: "Laporan kembali ditolak. Mahasiswa perlu mengirim ulang.",
  validated: "Kepulangan divalidasi. Izin selesai.",
};
