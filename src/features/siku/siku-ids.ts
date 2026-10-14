/** Whether an entry adds points to SIKU or takes them away. */
export const SIKU_KINDS = ["gain", "loss"] as const;

export type SikuKind = (typeof SIKU_KINDS)[number];

/** The reasons for a gain, in the prototype's order. */
export const GAIN_REASONS = [
  "social_media_campaign",
  "knowledge_sharing",
  "training_speaker",
  "peer_mentoring",
  "spiritual_activity",
] as const;

/** The reasons for a loss, in the prototype's order. */
export const LOSS_REASONS = [
  "student_violation",
  "discipline_penalty",
  "unannounced_absence",
  "director_decision",
] as const;

export const SIKU_REASONS = [...GAIN_REASONS, ...LOSS_REASONS] as const;

export type SikuReason = (typeof SIKU_REASONS)[number];

/** The loss whose entry must name the decision letter it rests on. */
export const REASON_WITH_BASIS: SikuReason = "director_decision";

/** The fewest and the most points one entry gives each of its students. */
export const POINTS_MIN = 1;
export const POINTS_MAX = 30;

export const ENTRY_NOTE_MAX_LENGTH = 500;
export const BASIS_MAX_LENGTH = 200;

/** The most students one entry may hold, far above a whole angkatan. */
export const STUDENTS_MAX = 2000;

/** The reasons a kind may have. */
export function reasonsOf(kind: SikuKind): readonly SikuReason[] {
  return kind === "gain" ? GAIN_REASONS : LOSS_REASONS;
}
