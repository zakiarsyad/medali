/** The line that always ends "Kesehatan mental" on Profil saya, as in the prototype. */
export const HELP_LINE =
  "Butuh bicara dengan seseorang sekarang? Hubungi konselor kampus atau orang yang Anda percaya. Dalam keadaan darurat, hubungi 119.";

/** "Kontak konseling kampus" under the help line, once the setting is filled in. */
export function campusContactLine(contact: string): string {
  return `Kontak konseling kampus: ${contact}`;
}

/** "Sesi konseling" of a student with no session. */
export const NO_SESSION_YET = "Belum ada";
