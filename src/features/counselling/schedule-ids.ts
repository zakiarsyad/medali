/*
 * The fixed facts of a counselling schedule. Read by the screen parts in
 * the browser and by the table definitions, so nothing here may take from
 * the database code.
 */

/** Who asked for the counselling: for now only the student, on their own. */
export const SCHEDULE_KINDS = ["voluntary"] as const;

export type ScheduleKind = (typeof SCHEDULE_KINDS)[number];

/**
 * Diajukan, Usulan jadwal lain, Dijadwalkan, Selesai, Tidak hadir and
 * Dibatalkan.
 */
export const SCHEDULE_STATUSES = [
  "submitted",
  "proposed",
  "scheduled",
  "done",
  "missed",
  "cancelled",
] as const;

export type ScheduleStatus = (typeof SCHEDULE_STATUSES)[number];

/** The statuses of a request that is still active. */
export const ACTIVE_STATUSES: readonly ScheduleStatus[] = [
  "submitted",
  "proposed",
  "scheduled",
];

/** The statuses of a request that is over: the student's "Riwayat". */
export const FINISHED_STATUSES: readonly ScheduleStatus[] = [
  "done",
  "missed",
  "cancelled",
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

/** The hours a counselling session may start, as the prototype has them. */
export const COUNSELLING_HOURS = ["08:30", "10:00", "13:00", "14:30"] as const;

export type CounsellingHour = (typeof COUNSELLING_HOURS)[number];

/** How the student and Konselor meet. */
export const COUNSELLING_WAYS = ["in_person", "online"] as const;

export type CounsellingWay = (typeof COUNSELLING_WAYS)[number];

/** Each step of a schedule, as its log keeps it. */
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
] as const;

export type ScheduleStep = (typeof SCHEDULE_STEPS)[number];

/** The longest "Ceritakan singkat" kept. */
export const STORY_MAX = 1000;

/** The longest "Pesan untuk mahasiswa" and "Alasan" kept. */
export const NOTE_MAX = 500;
