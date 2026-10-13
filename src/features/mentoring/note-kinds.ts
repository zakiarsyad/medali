import type { ValueKey } from "@/ui/medali-values";

/** The kinds of contact a note can be about, in the order the form offers them. */
export const NOTE_KINDS = [
  "individual_counselling",
  "group_mentoring",
  "appreciation",
  "attendance_monitoring",
  "discipline_guidance",
  "parent_visit",
] as const;

export type NoteKind = (typeof NOTE_KINDS)[number];

export const KIND_TITLES: Record<NoteKind, string> = {
  individual_counselling: "Konseling individu",
  group_mentoring: "Mentoring kelompok",
  appreciation: "Apresiasi",
  attendance_monitoring: "Pemantauan kehadiran",
  discipline_guidance: "Pembinaan disiplin",
  parent_visit: "Kunjungan orang tua/wali",
};

/**
 * The MEDALI values the form ticks when a kind is chosen, as in the
 * prototype. The mentor is free to change them.
 */
export const KIND_VALUES: Record<NoteKind, readonly ValueKey[]> = {
  individual_counselling: ["M", "A"],
  group_mentoring: ["L", "I", "E"],
  appreciation: ["E", "I"],
  attendance_monitoring: ["D"],
  discipline_guidance: ["D", "I"],
  parent_visit: ["M", "E"],
};

/** What a mentor can choose to do next, the first being nothing. */
export const FOLLOW_UPS = [
  "none",
  "watch_two_weeks",
  "schedule_counselling",
  "refer_to_psychologist",
  "involve_parents",
] as const;

export type FollowUp = (typeof FOLLOW_UPS)[number];

export const FOLLOW_UP_TITLES: Record<FollowUp, string> = {
  none: "Tidak perlu tindak lanjut",
  watch_two_weeks: "Pantau dua pekan",
  schedule_counselling: "Jadwalkan konseling lanjutan",
  refer_to_psychologist: "Rujuk ke psikolog kampus",
  involve_parents: "Libatkan orang tua/wali",
};

export function isNoteKind(sent: string): sent is NoteKind {
  return NOTE_KINDS.some((kind) => kind === sent);
}

export function isFollowUp(sent: string): sent is FollowUp {
  return FOLLOW_UPS.some((followUp) => followUp === sent);
}
