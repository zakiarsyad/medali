import type { Term } from "./academic-period";

const FIRST_MONTH_OF_GANJIL = 8;

/**
 * The Mulai the form suggests: 1 August of the first year for Ganjil,
 * 1 February of the second year for Genap.
 */
export function suggestedStart(startYear: number, term: Term): string {
  return term === "odd" ? `${startYear}-08-01` : `${startYear + 1}-02-01`;
}

/** The first year of the Tahun akademik a day falls in, August to July. */
export function academicYearOn(day: string): number {
  const year = Number(day.slice(0, 4));
  const month = Number(day.slice(5, 7));
  return month >= FIRST_MONTH_OF_GANJIL ? year : year - 1;
}
