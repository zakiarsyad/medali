/** The line that always ends "Kesehatan mental" on Profil saya, as in the prototype. */
export const HELP_LINE =
  "Butuh bicara dengan seseorang sekarang? Hubungi konselor kampus atau orang yang Anda percaya. Dalam keadaan darurat, hubungi 119.";

/** "Kontak konseling kampus" under the help line, once the setting is filled in. */
export function campusContactLine(contact: string): string {
  return `Kontak konseling kampus: ${contact}`;
}

/** "Sesi konseling" of a student with no session. */
export const NO_SESSION_YET = "Belum ada";

/** The button that takes the student to Konseling, where they answer or withdraw. */
export const OPEN_COUNSELLING = "Buka Konseling";

/** A consent request that waits for the student, named as Konseling names it. */
export const CONSENT_WAITS =
  "Permintaan persetujuan konseling menunggu jawaban Anda.";

/** A sharing request that waits for the student, named as Konseling names it. */
export const SHARING_WAITS =
  "Permintaan persetujuan berbagi data menunggu jawaban Anda.";

/** Under a given sharing: it is withdrawn on Konseling, not here. */
export const WITHDRAW_ON_COUNSELLING = "Untuk mencabut, buka Konseling.";
