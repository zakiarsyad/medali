import type { FormState } from "@/ui/form-message";
import { NO_GROUP } from "./group-choice-words";
import { CATEGORIES } from "./labels";
import type { StoredStudent, StudentFields } from "./student-input";

/** The student form with the choice that is not part of the record. */
export interface StudentFormFields extends StudentFields {
  /** The kelompok pengasuhan chosen, or empty for "Belum ditetapkan". */
  mentorGroupId: string;
}

/** What the student form says back after it is sent. */
export interface StudentFormState extends FormState {
  /** What was typed in a refused form, so that it is not lost. */
  values: StudentFormFields | null;
  /** How many times the form was sent. The form is drawn anew each time. */
  attempt: number;
}

export const START: StudentFormState = {
  error: null,
  done: null,
  values: null,
  attempt: 0,
};

export function refusedForm(
  before: StudentFormState,
  error: string,
  values: StudentFormFields,
): StudentFormState {
  return { error, done: null, values, attempt: before.attempt + 1 };
}

export function savedForm(
  before: StudentFormState,
  done: string,
): StudentFormState {
  return { error: null, done, values: null, attempt: before.attempt + 1 };
}

/**
 * What the form shows after a send: what was typed if it was refused, so
 * nothing is lost, and otherwise what it started with.
 */
export function formShows(
  state: StudentFormState,
  start: StudentFormFields,
): StudentFormFields {
  return state.values ?? start;
}

/** The first choice of the lists that differ from one day to the next. */
interface FirstChoices {
  studyProgramId: string;
  cohortYear: string;
}

/**
 * What the form shows before anything is typed: the student being changed,
 * or the first choices for a new one.
 */
export function formValues(
  student: StoredStudent | null,
  first: FirstChoices,
): StudentFormFields {
  if (!student) {
    return {
      ...first,
      nim: "",
      name: "",
      email: "",
      entryPath: "regular",
      sex: "male",
      className: "",
      province: "",
      originAgency: "",
      status: "active",
      categories: [],
      mentorGroupId: NO_GROUP,
    };
  }
  return {
    nim: student.nim,
    name: student.name,
    email: student.email ?? "",
    studyProgramId: String(student.studyProgramId),
    entryPath: student.entryPath,
    sex: student.sex,
    cohortYear: String(student.cohortYear),
    className: student.className ?? "",
    province: student.province ?? "",
    originAgency: student.originAgency ?? "",
    status: student.status,
    categories: CATEGORIES.map((category) => category.field).filter(
      (field) => student[field],
    ),
    mentorGroupId: student.mentorGroupId ?? NO_GROUP,
  };
}
