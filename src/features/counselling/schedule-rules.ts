import { daysAfter } from "@/academic-periods/days-after";
import { isWeekday } from "@/academic-periods/weekdays";
import { isDay } from "@/db/is-day";
import type { Parsed } from "@/parsed";
import {
  COUNSELLING_HOURS,
  COUNSELLING_TOPICS,
  COUNSELLING_WAYS,
  type CounsellingHour,
  type CounsellingTopic,
  type CounsellingWay,
  NOTE_MAX,
  type ScheduleStatus,
  type ScheduleStep,
  STORY_MAX,
} from "./schedule-ids";
import {
  NOTE_TOO_LONG,
  PICK_FROM_LIST,
  PICK_FROM_TOMORROW,
  PICK_WEEKDAY,
  STORY_TOO_LONG,
  TICK_CONSENT,
  TIME_PASSED,
  WEEKDAYS_ONLY,
} from "./schedule-words";

/** What a student sends to register; none of it is trusted. */
export interface SentRegistration {
  topic: unknown;
  day: unknown;
  hour: unknown;
  way: unknown;
  story: unknown;
  /** Whether the consent was ticked: only `true` counts. */
  consented: unknown;
}

export interface CheckedRegistration {
  topic: CounsellingTopic;
  day: string;
  hour: CounsellingHour;
  way: CounsellingWay;
  story: string | null;
}

export function isOneOf<T extends string>(
  list: readonly T[],
  sent: unknown,
): sent is T {
  return typeof sent === "string" && list.some((each) => each === sent);
}

export function isHour(sent: unknown): sent is CounsellingHour {
  return isOneOf(COUNSELLING_HOURS, sent);
}

export function isCounsellingWay(sent: unknown): sent is CounsellingWay {
  return isOneOf(COUNSELLING_WAYS, sent);
}

/**
 * An optional text trimmed, null when empty, or false when longer than
 * `max` or no text at all.
 */
export function optionalText(
  sent: unknown,
  max: number,
): string | null | false {
  if (sent === undefined || sent === null) return null;
  if (typeof sent !== "string") return false;
  const trimmed = sent.trim();
  if (trimmed.length > max) return false;
  return trimmed === "" ? null : trimmed;
}

/** A day a student picks: Senin to Jumat, from tomorrow on campus. */
export function checkStudentDay(sent: unknown, today: string): Parsed<string> {
  const tomorrow = daysAfter(today, 1);
  if (typeof sent !== "string" || !isDay(sent) || sent < tomorrow) {
    return { ok: false, error: PICK_FROM_TOMORROW };
  }
  if (!isWeekday(sent)) return { ok: false, error: WEEKDAYS_ONLY };
  return { ok: true, value: sent };
}

/**
 * "Daftar konseling": the day first, then the tick, as the prototype
 * checks them. `today` is today on campus.
 */
export function checkRegistration(
  sent: SentRegistration,
  today: string,
): Parsed<CheckedRegistration> {
  const { topic, hour, way } = sent;
  const isListed =
    isOneOf(COUNSELLING_TOPICS, topic) && isHour(hour) && isCounsellingWay(way);
  if (!isListed) return { ok: false, error: PICK_FROM_LIST };
  const day = checkStudentDay(sent.day, today);
  if (!day.ok) return day;
  if (sent.consented !== true) return { ok: false, error: TICK_CONSENT };
  const story = optionalText(sent.story, STORY_MAX);
  if (story === false) return { ok: false, error: STORY_TOO_LONG };
  return { ok: true, value: { topic, day: day.value, hour, way, story } };
}

/** What Konselor or the student does to a request once it is sent. */
export type ScheduleMove = Exclude<ScheduleStep, "register">;

export type CounsellorScheduleMove = Extract<
  ScheduleMove,
  "approve" | "propose" | "reschedule" | "mark_done" | "mark_missed"
>;

export type StudentScheduleMove = Extract<
  ScheduleMove,
  "accept" | "ask_another" | "cancel"
>;

/** The statuses each move may start from, and the status it gives. */
const MOVES: Record<
  ScheduleMove,
  { from: readonly ScheduleStatus[]; to: ScheduleStatus }
> = {
  approve: { from: ["submitted"], to: "scheduled" },
  propose: { from: ["submitted"], to: "proposed" },
  accept: { from: ["proposed"], to: "scheduled" },
  ask_another: { from: ["proposed", "scheduled"], to: "submitted" },
  cancel: { from: ["submitted", "proposed", "scheduled"], to: "cancelled" },
  reschedule: { from: ["scheduled"], to: "scheduled" },
  mark_done: { from: ["scheduled"], to: "done" },
  mark_missed: { from: ["scheduled"], to: "missed" },
};

/** What a request becomes after a move, or null when the move is not allowed. */
export function scheduleAfter(
  move: ScheduleMove,
  current: ScheduleStatus,
): ScheduleStatus | null {
  const { from, to } = MOVES[move];
  return from.includes(current) ? to : null;
}

/** Whether the day of a session has come: it is that day on campus, or later. */
export function hasDayCome(day: string, today: string): boolean {
  return day <= today;
}

/** Whether a time on campus has begun by `now`. */
export function hasPassed(day: string, hour: string, now: Date): boolean {
  return new Date(`${day}T${hour}:00+07:00`) <= now;
}

/** What Konselor sends with "Usulkan waktu lain"; none of it is trusted. */
export interface SentProposal {
  day: unknown;
  hour: unknown;
  way: unknown;
  message: unknown;
}

export interface CheckedProposal {
  day: string;
  hour: CounsellingHour;
  way: CounsellingWay;
  message: string | null;
}

/** "Usulkan waktu lain": a coming time on Senin to Jumat, and an optional message. */
export function checkProposal(
  sent: SentProposal,
  now: Date,
): Parsed<CheckedProposal> {
  const { day, hour, way } = sent;
  if (!isHour(hour) || !isCounsellingWay(way)) {
    return { ok: false, error: PICK_FROM_LIST };
  }
  if (typeof day !== "string" || !isDay(day) || !isWeekday(day)) {
    return { ok: false, error: PICK_WEEKDAY };
  }
  if (hasPassed(day, hour, now)) return { ok: false, error: TIME_PASSED };
  const message = optionalText(sent.message, NOTE_MAX);
  if (message === false) return { ok: false, error: NOTE_TOO_LONG };
  return { ok: true, value: { day, hour, way, message } };
}

/** What the student sends with "Minta waktu lain"; none of it is trusted. */
export interface SentAnotherTime {
  day: unknown;
  hour: unknown;
  reason: unknown;
}

export interface CheckedAnotherTime {
  day: string;
  hour: CounsellingHour;
  reason: string | null;
}

/** "Minta waktu lain": a day the student may pick, an hour, and an optional Alasan. */
export function checkAnotherTime(
  sent: SentAnotherTime,
  today: string,
): Parsed<CheckedAnotherTime> {
  const { hour } = sent;
  if (!isHour(hour)) return { ok: false, error: PICK_FROM_LIST };
  const day = checkStudentDay(sent.day, today);
  if (!day.ok) return day;
  const reason = optionalText(sent.reason, NOTE_MAX);
  if (reason === false) return { ok: false, error: NOTE_TOO_LONG };
  return { ok: true, value: { day: day.value, hour, reason } };
}
