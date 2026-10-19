/** What a choice made by hand answers to a role without the right. */
export const RESIDENTS_NOT_ALLOWED = {
  ok: false,
  error: "Anda tidak berhak menambah penghuni atau menjadikan non asrama.",
} as const;

export const STUDENT_MISSING = {
  ok: false,
  error: "Pilih mahasiswa.",
} as const;

export const NOT_ACTIVE = {
  ok: false,
  error: "Mahasiswa tidak ditemukan atau tidak aktif. Muat ulang halaman.",
} as const;
