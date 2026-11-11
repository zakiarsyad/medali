import { isDay } from "@/db/is-day";
import type { Parsed } from "@/parsed";

/** How Tanggal lahir is written on this page: month, day, then year. */
export const BIRTH_DATE_HINT = "MM/DD/YYYY";

export const NO_BIRTH_DATE = "Tanggal lahir wajib diisi.";
export const MALFORMED_BIRTH_DATE = `Tanggal lahir harus ditulis ${BIRTH_DATE_HINT}.`;
export const UNREAL_BIRTH_DATE = "Tanggal lahir tidak ada di kalender.";
export const LATER_BIRTH_DATE = "Tanggal lahir tidak boleh setelah hari ini.";

const MONTH_DAY_YEAR = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const YEAR_MONTH_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

function refused(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

/**
 * Reads a Tanggal lahir written MM/DD/YYYY into a day the way the database
 * keeps it. `today` is today on campus, written the same way.
 */
export function parseBirthDate(text: string, today: string): Parsed<string> {
  const written = text.trim();
  if (written === "") return refused(NO_BIRTH_DATE);
  const parts = MONTH_DAY_YEAR.exec(written);
  if (!parts) return refused(MALFORMED_BIRTH_DATE);
  const [, month, day, year] = parts;
  const kept = `${year}-${month}-${day}`;
  if (!isDay(kept)) return refused(UNREAL_BIRTH_DATE);
  if (kept > today) return refused(LATER_BIRTH_DATE);
  return { ok: true, value: kept };
}

/** A kept Tanggal lahir as this page shows it, such as 08/17/2005. */
export function shownBirthDate(day: string): string {
  const parts = YEAR_MONTH_DAY.exec(day);
  if (!parts) return day;
  const [, year, month, date] = parts;
  return `${month}/${date}/${year}`;
}
