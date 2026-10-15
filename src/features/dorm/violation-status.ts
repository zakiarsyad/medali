import type { AppealStatus } from "./appeal-ids";
import { APPEAL_HOURS } from "./violation-ids";

/*
 * Where a violation stands, by the server's clock. Read by the screen
 * parts in the browser, so nothing here may take from the database code.
 */

/**
 * Terjadwal: it waits for its announcement hour. Masa advokasi: it is
 * announced and may still be appealed. Advokasi diproses: its appeal
 * waits for BAM. Advokasi diterima: its appeal was accepted and it never
 * counts. Naik ke Pengelola: the appeal time is over without an appeal,
 * or its appeal was rejected, and it counts. Dikurangi: it went up and
 * Pengelola Asrama reduced it, so it no longer counts.
 */
export type ViolationStatus =
  | "scheduled"
  | "appeal"
  | "appeal_waiting"
  | "appeal_accepted"
  | "escalated"
  | "reduced";

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

/**
 * Where a violation announced at a moment stands at another moment, with
 * the status of its appeal, or null without one.
 */
export function violationStatus(
  announcedAt: Date,
  appeal: AppealStatus | null,
  now: Date,
): ViolationStatus {
  if (now < announcedAt) return "scheduled";
  if (appeal === "waiting") return "appeal_waiting";
  if (appeal === "accepted") return "appeal_accepted";
  if (appeal === "rejected") return "escalated";
  if (now < appealEndOf(announcedAt)) return "appeal";
  return "escalated";
}

/**
 * Where a violation stands on a record, with the moment it was reduced,
 * or null when it is not: only a violation that went up is reduced, and
 * it stays Dikurangi until the reduction is undone.
 */
export function recordStatus(
  announcedAt: Date,
  appeal: AppealStatus | null,
  reducedAt: Date | null,
  now: Date,
): ViolationStatus {
  if (reducedAt !== null) return "reduced";
  return violationStatus(announcedAt, appeal, now);
}
