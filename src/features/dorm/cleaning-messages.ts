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

export const DAY_REFUSED = { ok: false, error: "Pilih tanggal." } as const;

export const DAY_PAST = {
  ok: false,
  error: "Tanggal sudah lewat. Pilih hari ini atau sesudahnya.",
} as const;

export const ROOM_MISSING = {
  ok: false,
  error: "Pilih kamar bertugas.",
} as const;

export const ASSIGN_NOT_FOUND = {
  ok: false,
  error: "Tempat atau kamar tidak ditemukan. Muat ulang halaman.",
} as const;

export const ROOM_EMPTY = {
  ok: false,
  error: "Kamar ini tidak berpenghuni. Muat ulang halaman.",
} as const;

export const PLACE_TAKEN = {
  ok: false,
  error:
    "Tempat ini sudah ditugaskan ke kamar lain pada tanggal ini. Muat ulang halaman.",
} as const;

export const NOT_PLOTTED = "Kamar asrama ini belum diploting.";

export const DUTY_NOT_FOUND = {
  ok: false,
  error: "Tugas tidak ditemukan atau sudah lewat. Muat ulang halaman.",
} as const;

export const DUTY_ASSIGNED = "Kamar ditugaskan.";

export const ALL_SCHEDULED = "Semua kamar sudah dijadwalkan.";

export function ownRoomsAssigned(count: number): string {
  return `${count.toLocaleString("id-ID")} tugas kamar dijadwalkan.`;
}

export const DUTY_CANCELLED = "Tugas dibatalkan.";

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
