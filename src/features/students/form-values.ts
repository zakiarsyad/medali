import type { FormState } from "@/ui/form-message";
import { CATEGORIES } from "./labels";
import type { StudentFields, StudentInput } from "./student-input";

/** What the student form says back after it is sent. */
export interface StudentFormState extends FormState {
  /** What was typed in a refused form, so that it is not lost. */
  values: StudentFields | null;
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
  values: StudentFields,
): StudentFormState {
  return { error, done: null, values, attempt: before.attempt + 1 };
}

export function savedForm(
  before: StudentFormState,
  done: string,
): StudentFormState {
  return { error: null, done, values: null, attempt: before.attempt + 1 };
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
  student: StudentInput | null,
  first: FirstChoices,
): StudentFields {
  if (!student) {
    return {
      ...first,
      nim: "",
      name: "",
      entryPath: "regular",
      sex: "male",
      className: "",
      province: "",
      originAgency: "",
      status: "active",
      categories: [],
    };
  }
  return {
    nim: student.nim,
    name: student.name,
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
  };
}
