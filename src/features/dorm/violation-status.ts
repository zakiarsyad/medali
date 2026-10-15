import { APPEAL_HOURS } from "./violation-ids";

/*
 * Where a violation stands, by the server's clock. Read by the screen
 * parts in the browser, so nothing here may take from the database code.
 */

/**
 * Terjadwal: it waits for its announcement hour. Masa advokasi: it is
 * announced and may still be appealed. Naik ke Pengelola: the appeal
 * time is over and it counts.
 */
export type ViolationStatus = "scheduled" | "appeal" | "escalated";

const HOUR_MS = 60 * 60 * 1000;

/** The moment the appeal time of a violation announced at a moment ends. */
export function appealEndOf(announcedAt: Date): Date {
  return new Date(announcedAt.getTime() + APPEAL_HOURS * HOUR_MS);
}

/**
 * The latest announcement whose appeal time is over at a moment: every
 * violation announced then or earlier has gone up to Pengelola Asrama.
 */
export function lastEscalatedAnnouncement(now: Date): Date {
  return new Date(now.getTime() - APPEAL_HOURS * HOUR_MS);
}

/** Where a violation announced at a moment stands at another moment. */
export function violationStatus(announcedAt: Date, now: Date): ViolationStatus {
  if (now < announcedAt) return "scheduled";
  if (now < appealEndOf(announcedAt)) return "appeal";
  return "escalated";
}
