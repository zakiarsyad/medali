import type { Parsed } from "@/parsed";
import type { AcademicPeriod, Term } from "./academic-period";

export type PeriodDates = Pick<AcademicPeriod, "startsOn" | "endsOn">;
export type NewPeriod = Omit<AcademicPeriod, "id">;

/** The days of a period as a form sends them. */
export interface SentPeriodDates {
  startsOn: string;
  endsOn: string;
}

/** A new period as a form sends it. */
export interface SentPeriod extends SentPeriodDates {
  /** Both years of the Tahun akademik, such as 2026/2027. */
  year: string;
  term: string;
}

const EARLIEST_YEAR = 2000;
const LATEST_YEAR = 2100;
const BOTH_YEARS = /^(\d{4})\/(\d{4})$/;
const YEAR_MONTH_DAY = /^\d{4}-\d{2}-\d{2}$/;

const YEAR_REFUSED = {
  ok: false,
  error: "Tahun akademik ditulis seperti 2026/2027.",
} as const;
const TERM_REFUSED = { ok: false, error: "Pilih Ganjil atau Genap." } as const;
const DAYS_MISSING = {
  ok: false,
  error: "Isi tanggal Mulai dan Selesai.",
} as const;
const END_NOT_AFTER_START = {
  ok: false,
  error: "Selesai harus setelah Mulai.",
} as const;

/**
 * The first year of a Tahun akademik typed as two years that follow each
 * other, or null when it is typed another way.
 */
export function parseStartYear(sent: string): number | null {
  const years = sent.trim().match(BOTH_YEARS);
  if (!years) return null;
  const first = Number(years[1]);
  const second = Number(years[2]);
  if (second !== first + 1) return null;
  if (first < EARLIEST_YEAR || first > LATEST_YEAR) return null;
  return first;
}

function isTerm(sent: string): sent is Term {
  return sent === "odd" || sent === "even";
}

function isDay(sent: string): boolean {
  if (!YEAR_MONTH_DAY.test(sent)) return false;
  const at = new Date(`${sent}T00:00:00Z`);
  if (Number.isNaN(at.getTime())) return false;
  // A day that does not exist, such as 30 February, rolls into the next month.
  return at.toISOString().startsWith(sent);
}

/** Checks the days of a period as sent: two real days, the end after the start. */
export function parsePeriodDates(sent: SentPeriodDates): Parsed<PeriodDates> {
  const { startsOn, endsOn } = sent;
  if (!isDay(startsOn) || !isDay(endsOn)) return DAYS_MISSING;
  if (endsOn <= startsOn) return END_NOT_AFTER_START;
  return { ok: true, value: { startsOn, endsOn } };
}

/** Checks a new period as sent. */
export function parseNewPeriod(sent: SentPeriod): Parsed<NewPeriod> {
  const startYear = parseStartYear(sent.year);
  if (startYear === null) return YEAR_REFUSED;
  if (!isTerm(sent.term)) return TERM_REFUSED;
  const dates = parsePeriodDates(sent);
  if (!dates.ok) return dates;
  return { ok: true, value: { startYear, term: sent.term, ...dates.value } };
}
