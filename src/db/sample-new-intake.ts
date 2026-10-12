import { sampleFirstYears } from "./sample-dorms";
import type { SampleStudent } from "./sample-students";

/*
 * Made-up people only.
 */

/**
 * The program studi whose students of the first year are the sample new
 * angkatan: they have no kelompok pengasuhan yet, so that Penetapan
 * angkatan baru has groups to form.
 */
export const SAMPLE_NEW_INTAKE_PROGRAMS = ["D3 Pajak", "D3 Akuntansi"];

function isNewIntake(student: SampleStudent): boolean {
  return SAMPLE_NEW_INTAKE_PROGRAMS.includes(student.studyProgram);
}

/** The students of a first year who wait for their kelompok pengasuhan. */
export function sampleNewIntake(cohortYear: number): SampleStudent[] {
  return sampleFirstYears(cohortYear).filter(isNewIntake);
}

/** The other students of a first year, who are in a group already. */
export function sampleGroupedFirstYears(cohortYear: number): SampleStudent[] {
  return sampleFirstYears(cohortYear).filter(
    (student) => !isNewIntake(student),
  );
}
