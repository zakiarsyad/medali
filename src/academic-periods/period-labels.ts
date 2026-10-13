import type { AcademicPeriod, Term } from "./academic-period";

export const TERM_LABELS: Record<Term, string> = {
  odd: "Ganjil",
  even: "Genap",
};

/** A Tahun akademik as the screens write it, such as 2026/2027. */
export function academicYear(startYear: number): string {
  return `${startYear}/${startYear + 1}`;
}

/** A period as the screens name it, such as Ganjil 2026/2027. */
export function periodTitle(
  period: Pick<AcademicPeriod, "startYear" | "term">,
): string {
  return `${TERM_LABELS[period.term]} ${academicYear(period.startYear)}`;
}
