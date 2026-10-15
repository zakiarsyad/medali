import { daysAfter } from "@/academic-periods/days-after";

/*
 * Made-up fitness test scores only, for the made-up students.
 */

/** When a sample test was taken: some days ago this year, or last year. */
export type SampleTestDay = { daysAgo: number } | "last_year";

/** A sample save of scores for the members of one sample group. */
export interface SampleFitnessTest {
  /** The NIM and the score of each member tested. */
  scores: readonly (readonly [nim: string, score: number])[];
  when: SampleTestDay;
  /** Who saved it: the sample Penilai Mahasiswa or Kepala Unit. */
  enteredAs: "assessor" | "head_of_unit";
}

/** The day of a sample test last year: late in that year. */
const LAST_YEAR_MONTH_DAY = "-11-20";

/**
 * The day of a sample test, `today` being today on campus. A test of
 * this year is never put before New Year's Day, so it always counts in
 * "Sudah dites" of the year now running.
 */
export function sampleTestDay(today: string, when: SampleTestDay): string {
  const year = Number(today.slice(0, 4));
  if (when === "last_year") return `${year - 1}${LAST_YEAR_MONTH_DAY}`;
  const day = daysAfter(today, -when.daysAgo);
  const newYear = `${year}-01-01`;
  return day > newYear ? day : newYear;
}

/**
 * The sample saves, oldest first. They give scores of every category of
 * the starting limits; some are of last year only, one student was
 * tested again this year, and most students are not tested. D3 Pajak
 * students are among them, for the sample Ketua Program Studi and the
 * sample Pengasuh of its newest group.
 */
export const SAMPLE_FITNESS_TESTS: SampleFitnessTest[] = [
  {
    scores: [
      ["9900240014", 66],
      ["9900240050", 52],
      ["9900240051", 88],
    ],
    when: "last_year",
    enteredAs: "assessor",
  },
  {
    scores: [["9900230027", 79]],
    when: "last_year",
    enteredAs: "head_of_unit",
  },
  {
    scores: [
      ["9900250013", 91],
      ["9900250047", 74],
      ["9900250048", 63],
    ],
    when: { daysAgo: 40 },
    enteredAs: "assessor",
  },
  {
    scores: [
      ["9900230001", 86],
      ["9900230020", 58],
    ],
    when: { daysAgo: 20 },
    enteredAs: "assessor",
  },
  {
    scores: [
      ["9900250003", 45],
      ["9900250024", 70],
      ["9900250025", 85],
    ],
    when: { daysAgo: 10 },
    enteredAs: "head_of_unit",
  },
  {
    scores: [["9900240014", 81]],
    when: { daysAgo: 3 },
    enteredAs: "assessor",
  },
];
