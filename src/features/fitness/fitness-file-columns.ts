/*
 * The columns of a fitness test file and its template. Read by the
 * screen parts in the browser, so nothing here may take from the
 * database code.
 */

import { SCORE_MAX, SCORE_MIN } from "@/health-notes/fitness-ids";

/** The columns of a fitness file, in the order of the template. */
export const FITNESS_FILE_COLUMNS = [
  { title: "nim", others: [] as string[] },
  { title: "skor", others: ["nilai", "skor_kebugaran"] },
];

export const FITNESS_TEMPLATE_FILE_NAME = "templat-tes-kebugaran.csv";

/** What the score column takes, in the prototype's words. */
export const FITNESS_FILE_NOTE = `Skor ${SCORE_MIN}–${SCORE_MAX}.`;

/** A made-up student and the score 82. */
const TEMPLATE_EXAMPLE: readonly string[] = ["4121239999", "82"];

export function fitnessTemplateCsv(): string {
  const titles = FITNESS_FILE_COLUMNS.map((column) => column.title);
  return `${titles.join(",")}\n${TEMPLATE_EXAMPLE.join(",")}\n`;
}
