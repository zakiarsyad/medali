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
