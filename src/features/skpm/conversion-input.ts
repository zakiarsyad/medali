import type { Parsed } from "@/parsed";
import { POINTS_FOR_100_MAX, POINTS_FOR_100_MIN } from "./skpm-ids";

/** A whole number without a leading zero. */
const WHOLE_NUMBER = /^[1-9]\d{0,3}$/;

export const INVALID_POINTS = {
  ok: false,
  error: "Isi jumlah poin yang valid.",
} as const;

/** Checks "Poin untuk nilai 100" as sent: a whole number from 1 to 1000. */
export function parsePointsForHundred(sent: string): Parsed<number> {
  const typed = sent.trim();
  if (!WHOLE_NUMBER.test(typed)) return INVALID_POINTS;
  const points = Number(typed);
  if (points < POINTS_FOR_100_MIN || points > POINTS_FOR_100_MAX) {
    return INVALID_POINTS;
  }
  return { ok: true, value: points };
}
