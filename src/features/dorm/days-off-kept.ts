import type { Parsed } from "@/parsed";
import { DAYS_OFF_MAX } from "./activity-limits";

/** What a save or a mark answers when too many days off are still to come. */
export const TOO_MANY_DAYS_OFF = {
  ok: false,
  error: `Hari tanpa kegiatan mulai hari ini paling banyak ${DAYS_OFF_MAX} tanggal.`,
} as const;

/** The days off of today and later. */
export function stillToCome(
  daysOff: readonly string[],
  today: string,
): string[] {
  return daysOff.filter((day) => day >= today);
}

/**
 * The days off an activity keeps after its form is saved: every stored
 * day before today, whatever the form sends, so a past date never shows
 * the activity again, and the days the form sends. Only the days from
 * today on count against the limit, so a long past never stops a save.
 */
export function daysOffToKeep(
  stored: readonly string[],
  sent: readonly string[],
  today: string,
): Parsed<string[]> {
  const past = stored.filter((day) => day < today);
  const kept = [...new Set([...past, ...sent])].sort();
  if (stillToCome(kept, today).length > DAYS_OFF_MAX) return TOO_MANY_DAYS_OFF;
  return { ok: true, value: kept };
}
