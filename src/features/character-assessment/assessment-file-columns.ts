/*
 * The columns of a character assessment file and its template. Read by
 * the screen parts in the browser, so nothing here may take from the
 * database code.
 */

import { MEDALI_VALUES, type ValueKey } from "@/ui/medali-values";

/** The column of each MEDALI value: its name in small letters. */
const VALUE_COLUMNS = MEDALI_VALUES.map(({ name }) => ({
  title: name.toLowerCase(),
  others: [] as string[],
}));

/** The columns of an assessment file, in the order of the template. */
export const ASSESSMENT_FILE_COLUMNS = [
  { title: "nim", others: [] as string[] },
  ...VALUE_COLUMNS,
];

export const ASSESSMENT_TEMPLATE_FILE_NAME = "templat-asesmen-medali.csv";

/** What the score columns take, in the prototype's words. */
export const ASSESSMENT_FILE_NOTE = "Skor 40–100.";

/** A made-up student and the scores 80, 78, 84, 72, 82 and 86. */
const TEMPLATE_EXAMPLE: readonly string[] = [
  "4121239999",
  "80",
  "78",
  "84",
  "72",
  "82",
  "86",
];

export function assessmentTemplateCsv(): string {
  const titles = ASSESSMENT_FILE_COLUMNS.map((column) => column.title);
  return `${titles.join(",")}\n${TEMPLATE_EXAMPLE.join(",")}\n`;
}

/** The place of each value's column in a row, after nim. */
export function valueColumnPlace(key: ValueKey): number {
  return MEDALI_VALUES.findIndex((value) => value.key === key) + 1;
}
