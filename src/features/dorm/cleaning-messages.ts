import { PLACE_NAME_MAX_LENGTH, PLACE_NAME_MIN_LENGTH } from "./cleaning-ids";

/** What a change to Pembersihan asrama answers to a role without the right. */
export const CLEANING_NOT_ALLOWED = {
  ok: false,
  error: "Anda tidak berhak mengelola pembersihan asrama.",
} as const;

export const NAME_TOO_SHORT = {
  ok: false,
  error: `Nama tempat minimal ${PLACE_NAME_MIN_LENGTH} huruf.`,
} as const;

export const NAME_TOO_LONG = {
  ok: false,
  error: `Nama tempat paling panjang ${PLACE_NAME_MAX_LENGTH} huruf.`,
} as const;

export const NAME_TAKEN = {
  ok: false,
  error: "Tempat dengan nama ini sudah ada di asrama ini.",
} as const;

export const DORM_REFUSED = { ok: false, error: "Pilih asrama." } as const;

export const PLACE_NOT_FOUND = {
  ok: false,
  error: "Tempat tidak ditemukan. Muat ulang halaman.",
} as const;

export function placeAdded(name: string): string {
  return `Tempat ${name} ditambahkan.`;
}

export const PLACE_RENAMED = "Nama tempat diperbarui.";

export function placeRemoved(name: string): string {
  return `Tempat ${name} dihapus.`;
}

export function placeRestored(name: string): string {
  return `Tempat ${name} dikembalikan.`;
}
