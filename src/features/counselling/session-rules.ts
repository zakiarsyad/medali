import { isDay } from "@/db/is-day";
import type { Parsed } from "@/parsed";
import { COUNSELLING_TOPICS } from "./schedule-ids";
import { isOneOf } from "./schedule-rules";
import {
  SESSION_FOLLOW_UPS,
  SESSION_KINDS,
  SESSION_NOTES_MAX,
  type SessionContent,
} from "./session-ids";
import {
  DAY_IN_FUTURE,
  NEXT_BEFORE_DAY,
  NOTES_EMPTY,
  NOTES_TOO_LONG,
  PICK_NEXT_DAY,
  PICK_SESSION_CHOICES,
  PICK_SESSION_DAY,
} from "./session-words";

/** What Konselor sends of a session; none of it is trusted. */
export interface SentSession {
  day: unknown;
  kind: unknown;
  topic: unknown;
  notes: unknown;
  followUp: unknown;
  /** Empty when no next session is set. */
  nextDay: unknown;
}

function checkDay(sent: unknown, today: string): Parsed<string> {
  if (typeof sent !== "string" || !isDay(sent)) {
    return { ok: false, error: PICK_SESSION_DAY };
  }
  if (sent > today) return { ok: false, error: DAY_IN_FUTURE };
  return { ok: true, value: sent };
}

function checkNotes(sent: unknown): Parsed<string> {
  const notes = typeof sent === "string" ? sent.trim() : "";
  if (notes === "") return { ok: false, error: NOTES_EMPTY };
  if (notes.length > SESSION_NOTES_MAX) {
    return { ok: false, error: NOTES_TOO_LONG };
  }
  return { ok: true, value: notes };
}

function checkNextDay(sent: unknown, day: string): Parsed<string | null> {
  if (sent === undefined || sent === null || sent === "") {
    return { ok: true, value: null };
  }
  if (typeof sent !== "string" || !isDay(sent)) {
    return { ok: false, error: PICK_NEXT_DAY };
  }
  if (sent < day) return { ok: false, error: NEXT_BEFORE_DAY };
  return { ok: true, value: sent };
}

/**
 * A session as it is kept, or why it is refused: a day not after
 * `today`, the campus day, Jenis, Topik utama and Tindak lanjut from
 * their lists, notes that are not empty, and a next session, when one
 * is set, not before the day of the session.
 */
export function checkSession(
  sent: SentSession,
  today: string,
): Parsed<SessionContent> {
  const day = checkDay(sent.day, today);
  if (!day.ok) return day;
  const { kind, topic, followUp } = sent;
  const isListed =
    isOneOf(SESSION_KINDS, kind) &&
    isOneOf(COUNSELLING_TOPICS, topic) &&
    isOneOf(SESSION_FOLLOW_UPS, followUp);
  if (!isListed) return { ok: false, error: PICK_SESSION_CHOICES };
  const notes = checkNotes(sent.notes);
  if (!notes.ok) return notes;
  const nextDay = checkNextDay(sent.nextDay, day.value);
  if (!nextDay.ok) return nextDay;
  return {
    ok: true,
    value: {
      day: day.value,
      kind,
      topic,
      notes: notes.value,
      followUp,
      nextDay: nextDay.value,
    },
  };
}
