import type { Parsed } from "@/parsed";
import { KEEP_DAYS_MAX, KEEP_DAYS_MIN } from "./keep-days";

const WHOLE_NUMBER = /^\d{1,4}$/;

const REFUSED = {
  ok: false,
  error: `Lama simpan harus bilangan bulat ${KEEP_DAYS_MIN}–${KEEP_DAYS_MAX} hari.`,
} as const;

/** Checks the days proof files are kept, as sent: a whole number from 30 to 3650. */
export function parseKeepDays(sent: string): Parsed<number> {
  const typed = sent.trim();
  if (!WHOLE_NUMBER.test(typed)) return REFUSED;
  const days = Number(typed);
  if (days < KEEP_DAYS_MIN || days > KEEP_DAYS_MAX) return REFUSED;
  return { ok: true, value: days };
}
