import { campusDay } from "@/academic-periods/campus-day";
import type { Parsed } from "@/parsed";
import { lettersIn } from "@/ui/letters-in";
import { momentOf } from "./leave-time";
import {
  CALL_DAYS_AHEAD_MAX,
  type CallSchedule,
  PLACE_MAX_LENGTH,
  PLACE_MIN_LENGTH,
} from "./warning-ids";

/*
 * The rules of what Pengelola Asrama writes in the form of a call, apart
 * from the database. Read by the form in the browser, so nothing here
 * may take from the database code.
 */

export const SCHEDULE_INCOMPLETE = "Lengkapi jadwal klarifikasi.";
export const SCHEDULE_NOT_KNOWN =
  "Tanggal atau jam klarifikasi tidak dikenal. Pilih dari kalender.";
export const SCHEDULE_IN_PAST =
  "Jadwal klarifikasi sudah lewat. Pilih waktu yang akan datang.";
export const SCHEDULE_TOO_FAR = `Jadwal klarifikasi paling lambat ${CALL_DAYS_AHEAD_MAX} hari dari hari ini.`;
export const PLACE_LENGTH = `Tempat ${PLACE_MIN_LENGTH} sampai ${PLACE_MAX_LENGTH} karakter.`;

const DAY_MS = 24 * 60 * 60 * 1000;

/** The database keeps no text with this character; only a hand-made request sends it. */
const NOT_KEPT_AS_TEXT = "\u0000";

/** What was sent as text, without spaces around it; anything else is empty. */
export function keptText(sent: unknown): string {
  if (typeof sent !== "string") return "";
  return sent.replaceAll(NOT_KEPT_AS_TEXT, "").trim();
}

function refused(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

/** The campus day `days` days after the one of `now`. */
function daysAfter(now: Date, days: number): string {
  return campusDay(new Date(now.getTime() + days * DAY_MS));
}

/** The last day a call may be held on, `CALL_DAYS_AHEAD_MAX` days after today. */
export function lastCallDay(now: Date): string {
  return daysAfter(now, CALL_DAYS_AHEAD_MAX);
}

/** The day the form offers a new call on, as in the prototype: tomorrow. */
export function firstOfferedDay(now: Date): string {
  return daysAfter(now, 1);
}

/**
 * Tanggal, Jam and Tempat of a call, at `now` by the server's clock.
 * Nothing sent is trusted: every field is needed, the moment must be to
 * come and no more than 30 days ahead, and Tempat 3 to 100 letters.
 */
export function parseCallSchedule(
  sent: { day: unknown; time: unknown; place: unknown },
  now: Date,
): Parsed<CallSchedule> {
  const day = keptText(sent.day);
  const time = keptText(sent.time);
  const place = keptText(sent.place);
  if (day === "" || time === "" || place === "") {
    return refused(SCHEDULE_INCOMPLETE);
  }
  const at = momentOf(`${day}T${time}`);
  if (at === null) return refused(SCHEDULE_NOT_KNOWN);
  if (at.getTime() <= now.getTime()) return refused(SCHEDULE_IN_PAST);
  if (day > lastCallDay(now)) return refused(SCHEDULE_TOO_FAR);
  const letters = lettersIn(place);
  if (letters < PLACE_MIN_LENGTH || letters > PLACE_MAX_LENGTH) {
    return refused(PLACE_LENGTH);
  }
  return { ok: true, value: { day, time, place } };
}
