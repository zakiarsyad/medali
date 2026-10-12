/** What a step answers to a role without the right to prepare a penetapan. */
export const NOT_ALLOWED = {
  ok: false,
  error: "Anda tidak berhak menyiapkan penetapan angkatan baru.",
} as const;

/** What "Tetapkan" and "Batalkan penetapan" answer to any role but Kepala Unit. */
export const NOT_ALLOWED_TO_FIX = {
  ok: false,
  error:
    "Anda tidak berhak menetapkan atau membatalkan penetapan angkatan baru.",
} as const;

/** What a save made from an older draft is told. The latest is then shown. */
export const DRAFT_CHANGED = {
  ok: false,
  error:
    "Draf sudah diubah orang lain. Draf terbaru sekarang ditampilkan, periksa lalu ulangi perubahan Anda.",
} as const;

export const ALREADY_FIXED = {
  ok: false,
  error: "Angkatan ini sudah ditetapkan, sehingga tidak bisa diubah lagi.",
} as const;

/** What a cancel is told for an angkatan that is not fixed. */
export const NOT_FIXED = {
  ok: false,
  error: "Angkatan ini belum ditetapkan, sehingga tidak ada yang dibatalkan.",
} as const;

/** What a change is told for an angkatan whose groups are not formed. */
export const NO_DRAFT = {
  ok: false,
  error: "Kelompok angkatan ini belum dibentuk. Bentuk kelompok lebih dulu.",
} as const;

/** What a change is told for a group that is not of the draft. */
export const GROUP_NOT_IN_DRAFT = {
  ok: false,
  error:
    "Kelompok ini tidak ada pada draf. Muat ulang halaman, lalu coba lagi.",
} as const;

/** What a form is told when it was not sent by the tab as it is. */
export const NOT_UNDERSTOOD = {
  ok: false,
  error: "Data yang dikirim tidak lengkap. Muat ulang halaman, lalu coba lagi.",
} as const;
