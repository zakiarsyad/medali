/**
 * The topics "Topik" suggests, in the order of a semester. A meeting
 * starts with the one of its number. The prototype's list.
 */
export const MEETING_TOPICS = [
  "Orientasi kelompok dan kontrak belajar",
  "Refleksi nilai Mandiri dan Disiplin",
  "Empati dan kerja sama dalam kelompok",
  "Adaptif menghadapi perubahan",
  "Loyal kepada institusi dan negara",
  "Integritas dan antikorupsi",
  "Evaluasi semester dan rencana tindak lanjut",
] as const;

/** The topic a meeting of a number starts with. */
export function suggestedTopic(number: number): string {
  return MEETING_TOPICS[number - 1] ?? "";
}
