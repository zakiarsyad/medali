import {
  COACHING_NOTE_MAX_LENGTH,
  COACHING_STATUS_WORDS,
  type CoachingStatus,
} from "@/character-scores/coaching-status";

/*
 * What a change of a coaching status answers, in the words the screen
 * shows. Read by the screen parts in the browser, so nothing here may
 * take from the database code.
 */

export const NOT_ALLOWED_TO_CHANGE = {
  ok: false,
  error:
    "Anda tidak berhak mengubah status pembinaan. Status diubah oleh Kepala Unit, dan oleh Pengasuh untuk mahasiswa binaannya.",
} as const;

export const NOT_A_COACHING_STATUS = {
  ok: false,
  error: "Pilih status Teridentifikasi, Konseling, Pemantauan, atau Selesai.",
} as const;

export const COACHING_NOTE_TOO_LONG = {
  ok: false,
  error: `Catatan paling banyak ${COACHING_NOTE_MAX_LENGTH} karakter. Persingkat catatannya.`,
} as const;

export const NOT_IN_COACHING = {
  ok: false,
  error:
    "Mahasiswa ini tidak ada di daftar pembinaan yang dapat Anda ubah. Muat ulang halaman.",
} as const;

/** What a change made on a status someone else changed since it was shown answers. */
export const COACHING_OUTDATED = {
  ok: false,
  error:
    "Status mahasiswa ini baru saja diubah orang lain. Yang tampil sekarang adalah statusnya yang terbaru; pilih lagi bila masih perlu.",
} as const;

/** What a kept change says: whose status and what it is now. */
export function statusChangedMessage(
  name: string,
  status: CoachingStatus,
): string {
  return `Status ${name}: ${COACHING_STATUS_WORDS[status]}.`;
}
