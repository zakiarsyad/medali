/*
 * The words of a call for counselling made from Asesmen karakter. Read
 * by the screen parts in the browser.
 */

export const CALL_BUTTON = "Panggil konseling";

export const ALREADY_CALLED = "Sudah ditugaskan.";

export const CALL_NOT_ALLOWED_WORDS =
  "Anda tidak memiliki hak untuk memanggil mahasiswa untuk konseling.";

export const NOT_LISTED =
  "Mahasiswa ini tidak teridentifikasi perlu pembinaan. Muat ulang halaman.";

export const NO_RUNNING_PERIOD =
  "Belum ada periode akademik berjalan. Pemanggilan konseling dapat dikirim setelah periode akademik ditetapkan.";

export function callSent(name: string): string {
  return `Pemanggilan konseling dikirim untuk ${name}.`;
}

/** Asked before a call is sent, as the student is told of it. */
export function callQuestion(name: string): string {
  return `Panggil ${name} untuk konseling? Mahasiswa akan melihat pemanggilan ini di Konseling, dan hanya bisa dipanggil sekali dalam periode akademik ini.`;
}
