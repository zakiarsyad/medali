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

/** What a mentor can choose to do next, the first being nothing. */
export const FOLLOW_UPS = [
  "none",
  "watch_two_weeks",
  "schedule_counselling",
  "refer_to_psychologist",
  "involve_parents",
] as const;

export type FollowUp = (typeof FOLLOW_UPS)[number];
