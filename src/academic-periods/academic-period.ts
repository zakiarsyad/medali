export type Term = "odd" | "even";

/** One academic period, with its first and its last day as year-month-day. */
export interface AcademicPeriod {
  id: string;
  /** The first year of the Tahun akademik: 2026 for 2026/2027. */
  startYear: number;
  term: Term;
  startsOn: string;
  endsOn: string;
}
