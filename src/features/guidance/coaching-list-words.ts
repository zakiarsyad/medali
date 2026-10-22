import {
  INTENSIVE_BELOW_RERATA,
  LISTED_BELOW_RERATA,
  LISTED_BELOW_SCORE,
} from "@/character-scores/coaching-need";

/*
 * The words of Pembinaan karakter. Read by the screen parts in the
 * browser, so nothing here may take from the database code.
 */

export const COACHING_LEDE = `Mahasiswa aktif dengan rerata di bawah ${LISTED_BELOW_RERATA} atau salah satu nilai di bawah ${LISTED_BELOW_SCORE}. Perbarui status setelah setiap langkah pendampingan.`;

export const NO_COACHING_FOUND = "Tidak ada mahasiswa pada filter ini.";

/** Said under the list: choosing Konseling here sends nobody to counselling. */
export const COUNSELLING_ONLY_A_MARK =
  "Status Konseling di sini hanya penanda; mahasiswa tidak otomatis didaftarkan konseling.";

export const INTENSIVE_NOTE = `rerata di bawah ${INTENSIVE_BELOW_RERATA}`;

export const MODERATE_NOTE = `rerata ${INTENSIVE_BELOW_RERATA}–${LISTED_BELOW_RERATA - 1}`;

export const LIGHT_NOTE = `satu nilai di bawah ${LISTED_BELOW_SCORE}`;

/** What one row of the list is, as the pager says it. */
export const COACHING_NOUN = "mahasiswa";

/** "dari (n) teridentifikasi" under Belum selesai. */
export function identifiedWords(identified: number): string {
  return `dari ${identified.toLocaleString("id-ID")} teridentifikasi`;
}
