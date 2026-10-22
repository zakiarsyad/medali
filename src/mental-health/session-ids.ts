import type { CounsellingTopic } from "./schedule-ids";

/*
 * The fixed facts of a counselling session that Konselor writes down.
 * Read by the screen parts in the browser and by the table definitions,
 * so nothing here may take from the database code.
 */

/** Individu tatap muka, Individu daring and Kelompok. */
export const SESSION_KINDS = [
  "individual_in_person",
  "individual_online",
  "group",
] as const;

export type SessionKind = (typeof SESSION_KINDS)[number];

/**
 * Sesi lanjutan, Pemantauan, Rujuk ke psikolog klinis, Rujuk ke
 * psikiater and Selesai.
 */
export const SESSION_FOLLOW_UPS = [
  "next_session",
  "monitoring",
  "refer_psychologist",
  "refer_psychiatrist",
  "closed",
] as const;

export type FollowUp = (typeof SESSION_FOLLOW_UPS)[number];

/** Each change of a session, as its log keeps it. */
export const SESSION_STEPS = ["write", "change"] as const;

export type SessionStep = (typeof SESSION_STEPS)[number];

/** The longest "Catatan sesi (rahasia)" kept. */
export const SESSION_NOTES_MAX = 5000;

/** What Konselor writes down of a session. */
export interface SessionContent {
  day: string;
  kind: SessionKind;
  topic: CounsellingTopic;
  notes: string;
  followUp: FollowUp;
  /** "Sesi berikutnya", when one is set. */
  nextDay: string | null;
}

/** A session as its log keeps it: every part but the notes. */
export type LoggedSession = Omit<SessionContent, "notes">;

/** What a log line says of the notes, never their words. */
export type NotesStep = "written" | "changed" | "unchanged";

/** A session after a writing or a change, as its log keeps it. */
export interface LoggedSessionAfter extends LoggedSession {
  notes: NotesStep;
}
