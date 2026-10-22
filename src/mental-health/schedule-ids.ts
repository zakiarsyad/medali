/*
 * The fixed facts of a counselling schedule. Read by the screen parts in
 * the browser and by the table definitions, so nothing here may take from
 * the database code.
 */

/**
 * The Jenis: Sukarela, asked for by the student on their own; Penugasan,
 * konseling wajib from Pembina Disiplin Mahasiswa; and Pemanggilan, a
 * call from Penilai Mahasiswa after the character assessment.
 */
export const SCHEDULE_KINDS = ["voluntary", "assigned", "called"] as const;

export type ScheduleKind = (typeof SCHEDULE_KINDS)[number];

/** The kinds the student did not ask for: an assignment. */
export type AssignmentKind = Exclude<ScheduleKind, "voluntary">;

/** The Topik of an assignment, which follows from its Jenis. */
export const ASSIGNMENT_TOPICS = {
  assigned: "discipline_violation",
  called: "character_assessment",
} as const satisfies Record<AssignmentKind, string>;

export type AssignmentTopic =
  (typeof ASSIGNMENT_TOPICS)[keyof typeof ASSIGNMENT_TOPICS];

/**
 * Diajukan, Usulan jadwal lain, Dijadwalkan, Selesai, Tidak hadir,
 * Dibatalkan, and for an assignment Menunggu jadwal and Minta jadwal
 * ulang.
 */
export const SCHEDULE_STATUSES = [
  "submitted",
  "proposed",
  "scheduled",
  "done",
  "missed",
  "cancelled",
  "awaiting",
  "reschedule_asked",
] as const;

export type ScheduleStatus = (typeof SCHEDULE_STATUSES)[number];

/** The statuses of a request that is still active. */
export const ACTIVE_STATUSES: readonly ScheduleStatus[] = [
  "submitted",
  "proposed",
  "scheduled",
  "awaiting",
  "reschedule_asked",
];

/** The statuses of a request that is over: the student's "Riwayat". */
export const FINISHED_STATUSES: readonly ScheduleStatus[] = [
  "done",
  "missed",
  "cancelled",
];

/** The statuses that wait for Konselor to set or approve a time. */
export const TO_SCHEDULE_STATUSES: readonly ScheduleStatus[] = [
  "submitted",
  "awaiting",
  "reschedule_asked",
];

export const COUNSELLING_TOPICS = [
  "academic",
  "campus_adjustment",
  "family",
  "social_relations",
  "finances",
  "emotions_and_stress",
  "other",
] as const;

export type CounsellingTopic = (typeof COUNSELLING_TOPICS)[number];

/** The Topik of any schedule: picked by the student, or that of an assignment. */
export type ScheduleTopic = CounsellingTopic | AssignmentTopic;

/** The hours a counselling session may start, as the prototype has them. */
export const COUNSELLING_HOURS = ["08:30", "10:00", "13:00", "14:30"] as const;

export type CounsellingHour = (typeof COUNSELLING_HOURS)[number];

/** How the student and Konselor meet. */
export const COUNSELLING_WAYS = ["in_person", "online"] as const;

export type CounsellingWay = (typeof COUNSELLING_WAYS)[number];

/**
 * Each step of a schedule, as its log keeps it. An assignment starts
 * with "assign" or "call", the step of its sender.
 */
export const SCHEDULE_STEPS = [
  "register",
  "approve",
  "propose",
  "accept",
  "ask_another",
  "cancel",
  "reschedule",
  "mark_done",
  "mark_missed",
  "assign",
  "call",
  "set_time",
] as const;

export type ScheduleStep = (typeof SCHEDULE_STEPS)[number];

/** The longest "Ceritakan singkat" kept. */
export const STORY_MAX = 1000;

/** The longest "Pesan untuk mahasiswa" and "Alasan" kept. */
export const NOTE_MAX = 500;

/** The longest "Dasar" and "Pesan pengirim" of an assignment kept. */
export const ASSIGNMENT_TEXT_MAX = 500;
