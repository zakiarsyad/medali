/** What a change to the dorm activities answers to a role without the right. */
export const ACTIVITIES_NOT_ALLOWED = {
  ok: false,
  error: "Anda tidak berhak mengelola kegiatan asrama.",
} as const;

/** What a change or a removal answers when the activity is not there. */
export const ACTIVITY_NOT_FOUND = {
  ok: false,
  error:
    "Kegiatan ini sudah tidak ada, mungkin baru saja dihapus orang lain. Tekan Batal; daftar di bawah sudah menampilkan yang terbaru.",
} as const;

/** What a change answers when the activity was changed after its form opened. */
export const ACTIVITY_CHANGED_BY_OTHER = {
  ok: false,
  error: "Kegiatan sudah diubah orang lain. Muat ulang.",
} as const;

/**
 * What an add answers when its key is that of an activity it did not
 * just add: the form was sent before and changed since, or the key is
 * not its own.
 */
export const ACTIVITY_ALREADY_SENT = {
  ok: false,
  error:
    "Formulir ini sudah pernah terkirim, jadi isian yang sekarang tidak disimpan. Muat ulang halaman, periksa daftar kegiatan, lalu tambahkan lagi bila masih perlu.",
} as const;

/** A one-off activity of a day gone by is kept as it was held. */
export const ONE_OFF_IS_PAST = {
  ok: false,
  error:
    "Kegiatan non rutin yang tanggalnya sudah lewat tidak dapat diubah atau dihapus.",
} as const;

/** A change may not move a one-off activity to a day gone by. */
export const ONE_OFF_BEFORE_TODAY = {
  ok: false,
  error: "Tanggal kegiatan non rutin tidak boleh sebelum hari ini.",
} as const;

export const ONLY_ROUTINE_HAS_DAYS_OFF = {
  ok: false,
  error: "Hanya kegiatan rutin yang dapat ditandai tidak ada kegiatan.",
} as const;

export const NO_DAY_PICKED = {
  ok: false,
  error: "Pilih tanggal yang benar.",
} as const;

export const KIND_KEPT = {
  ok: false,
  error:
    "Kegiatan rutin tidak dapat diubah menjadi non rutin, atau sebaliknya. Muat ulang halaman.",
} as const;

/**
 * Whether a refusal means the list the form was opened from is out of
 * date: someone else changed or removed the activity since. The list is
 * then read again, so the person sees what is there now.
 */
export function isOutdatedList(error: string): boolean {
  return (
    error === ACTIVITY_NOT_FOUND.error ||
    error === ACTIVITY_CHANGED_BY_OTHER.error
  );
}
