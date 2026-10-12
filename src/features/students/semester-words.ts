import { stageNameOf } from "@/academic-periods/stages";

const BETWEEN = " · ";

/**
 * What a row of the list says under the angkatan: the semester and its
 * tahap when a semester is known, then the kelas when one is kept.
 */
export function rowSemesterWords(
  semester: number | null,
  className: string | null,
): string {
  const words: string[] = [];
  if (semester !== null) {
    words.push(`Smt ${semester}`, stageNameOf(semester));
  }
  if (className) words.push(className);
  return words.join(BETWEEN);
}
