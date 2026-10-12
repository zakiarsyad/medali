import { studentSemester } from "@/academic-periods/student-semester";
import { DORM_NAMES } from "@/dorms/dorms";
import { dormOf, type ResidentFacts } from "@/dorms/resident-rule";
import { ENTRY_PATH_LABELS, SEX_LABELS, STATUS_LABELS } from "./labels";
import type { RunningPeriod } from "./semester-now";
import type { StudentFields } from "./student-input";

/** The fields of the student form that say where the student will live. */
export type ResidentFields = Pick<
  StudentFields,
  "entryPath" | "sex" | "cohortYear" | "status" | "categories"
>;

const YEAR = /^\d{4}$/;

function isChoiceOf<Choice extends string>(
  labels: Record<Choice, string>,
  text: string,
): text is Choice {
  return Object.hasOwn(labels, text);
}

/** What the rule reads of the form, or null while a choice is not made. */
function residentFacts(fields: ResidentFields): ResidentFacts | null {
  const { entryPath, sex, status, categories } = fields;
  if (!isChoiceOf(ENTRY_PATH_LABELS, entryPath)) return null;
  if (!isChoiceOf(SEX_LABELS, sex)) return null;
  if (!isChoiceOf(STATUS_LABELS, status)) return null;
  return {
    entryPath,
    sex,
    status,
    isInternational: categories.includes("isInternational"),
    isSeedling: categories.includes("isSeedling"),
  };
}

/**
 * The note of the student form: whether the student being filled in will
 * live in the dorm, and in which. Null while a field it needs is not
 * filled, so the form says nothing then. While no academic period runs no
 * semester is known, as everywhere the resident rule is read.
 */
export function residentNote(
  fields: ResidentFields,
  period: RunningPeriod,
): string | null {
  const facts = residentFacts(fields);
  if (facts === null) return null;
  if (!YEAR.test(fields.cohortYear)) return null;
  const cohortYear = Number(fields.cohortYear);
  const semester = period ? studentSemester(cohortYear, period) : null;
  const dorm = dormOf(facts, semester);
  if (dorm === null) return "Bukan penghuni asrama.";
  return `Masuk penghuni ${DORM_NAMES[dorm]}.`;
}
