import { studentSemester } from "@/academic-periods/student-semester";
import { FEWEST_IN_COHORT_UNFILTERED, FEWEST_SHOWN } from "./achievement-recap";
import type { CohortRecap } from "./cohort-recaps";
import type { RunningPeriod } from "./dashboard-view";
import { ENTRY_PATH_WORDS } from "./filter-choices";

/** The jalur of a cohort row, with its semester while a period runs. */
export function cohortDetail(
  row: Pick<CohortRecap, "cohortYear" | "entryPath">,
  period: RunningPeriod,
): string {
  const path = ENTRY_PATH_WORDS[row.entryPath];
  if (period === null) return path;
  return `${path} · Smt ${studentSemester(row.cohortYear, period)}`;
}

/** What the table says when no cohort may be shown. */
export function noCohortWords(filtered: boolean): string {
  const fewest = filtered ? FEWEST_SHOWN : FEWEST_IN_COHORT_UNFILTERED;
  return `Tidak ada angkatan yang dapat ditampilkan. Angkatan tampil bila minimal ${fewest} mahasiswa sudah diasesmen dan nilai perorangan tidak dapat ditebak dari angkatan lain.`;
}
