import { levelOf, stageNameOf } from "@/academic-periods/stages";
import type { students } from "@/db/schema";

type Status = (typeof students.$inferSelect)["status"];

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

/**
 * What the detail says for "Semester · tahap". The tingkat has the number
 * of the tahap. A Non aktif student is in no semester, and nobody's
 * semester is known while no academic period runs.
 */
export function detailSemesterWords(
  status: Status,
  semester: number | null,
): string {
  if (status === "inactive") return "Tidak aktif";
  if (semester === null) return "-";
  const stage = `Tahap ${stageNameOf(semester)} (tingkat ${levelOf(semester)})`;
  return `Semester ${semester}${BETWEEN}${stage}`;
}
