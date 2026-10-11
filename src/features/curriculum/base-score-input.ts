import type { Parsed } from "@/parsed";

const HIGHEST_SCORE = 100;
const WHOLE_NUMBER = /^\d{1,3}$/;

const REFUSED = { ok: false, error: "Nilai dasar harus 0–100." } as const;

/** Checks the SIKU base score as sent: a whole number from 0 to 100. */
export function parseBaseScore(sent: string): Parsed<number> {
  const typed = sent.trim();
  if (!WHOLE_NUMBER.test(typed)) return REFUSED;
  const score = Number(typed);
  if (score > HIGHEST_SCORE) return REFUSED;
  return { ok: true, value: score };
}
