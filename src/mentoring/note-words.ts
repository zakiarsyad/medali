import type { FollowUp, NoteKind } from "./note-ids";

/** How a kind of note is named on screen. */
export const KIND_TITLES: Record<NoteKind, string> = {
  individual_counselling: "Konseling individu",
  group_mentoring: "Mentoring kelompok",
  appreciation: "Apresiasi",
  attendance_monitoring: "Pemantauan kehadiran",
  discipline_guidance: "Pembinaan disiplin",
  parent_visit: "Kunjungan orang tua/wali",
};

/** How a follow-up is named on screen. */
export const FOLLOW_UP_TITLES: Record<FollowUp, string> = {
  none: "Tidak perlu tindak lanjut",
  watch_two_weeks: "Pantau dua pekan",
  schedule_counselling: "Jadwalkan konseling lanjutan",
  refer_to_psychologist: "Rujuk ke psikolog kampus",
  involve_parents: "Libatkan orang tua/wali",
};
