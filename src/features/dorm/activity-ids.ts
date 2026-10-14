import { DORM_IDS } from "@/dorms/dorms";

/** The Kategori of a dorm activity, in the order the form offers them. */
export const ACTIVITY_CATEGORIES = [
  "roll_call",
  "worship",
  "sport",
  "cleaning",
  "character_building",
  "study_together",
  "arts_and_culture",
  "other",
] as const;

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

/** How a repeating activity (rutin) repeats. */
export const ROUTINE_PATTERNS = ["daily", "weekly", "monthly"] as const;

export type RoutinePattern = (typeof ROUTINE_PATTERNS)[number];

/** A one-off activity (non rutin) takes place once, on its date. */
export const ONE_OFF = "once";

export const ACTIVITY_PATTERNS = [ONE_OFF, ...ROUTINE_PATTERNS] as const;

export type ActivityPattern = (typeof ACTIVITY_PATTERNS)[number];

/** Who is the penanggung jawab of an activity. */
export const ORGANISERS = ["upk", "coach", "bam"] as const;

export type Organiser = (typeof ORGANISERS)[number];

/**
 * The Peserta of an activity: every resident, the men, the women, or the
 * residents of one dorm.
 */
export const AUDIENCES = ["all", "men", "women", ...DORM_IDS] as const;

export type Audience = (typeof AUDIENCES)[number];

/** One line of Rincian kegiatan: a time as it was typed, and what happens. */
export interface RundownLine {
  time: string;
  activity: string;
}

/** The last date of a month an activity may repeat on: every month has it. */
export const LAST_MONTH_DAY = 28;
