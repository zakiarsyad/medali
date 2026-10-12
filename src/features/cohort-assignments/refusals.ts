/** What a step answers to a role without the right to prepare a penetapan. */
export const NOT_ALLOWED = {
  ok: false,
  error: "Anda tidak berhak menyiapkan penetapan angkatan baru.",
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

/** What a form is told when it was not sent by the tab as it is. */
export const NOT_UNDERSTOOD = {
  ok: false,
  error: "Data yang dikirim tidak lengkap. Muat ulang halaman, lalu coba lagi.",
} as const;
