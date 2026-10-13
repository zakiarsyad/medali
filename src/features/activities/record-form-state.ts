import type { FormState } from "@/ui/form-message";
import type { AttendanceStatus } from "./attendance-status";
import type {
  RecordActivity,
  RecordAnswer,
  RecordKind,
  RecordStudent,
} from "./manual-record";

/*
 * What the form "Catat kehadiran manual atau dispensasi" keeps between
 * presses, apart from how it is drawn, so it can be checked without a
 * browser. Read by the form in the browser: nothing here may take from
 * the database code.
 */

export interface RecordForm {
  student: RecordStudent | null;
  /** The activities of the picked student, once the server has listed them. */
  activities: RecordActivity[];
  scheduleId: string;
  kind: RecordKind;
  note: string;
  /** The status the person was asked about, which the next "Simpan" replaces. */
  agreed: AttendanceStatus | null;
  state: FormState;
}

export type RecordFormEvent =
  | { kind: "picked"; student: RecordStudent | null }
  | { kind: "listed"; studentId: string; activities: RecordActivity[] }
  | { kind: "chose"; scheduleId: string }
  | { kind: "set-kind"; value: RecordKind }
  | { kind: "typed"; note: string }
  | { kind: "answered"; answer: RecordAnswer };

const NO_WORDS: FormState = { error: null, done: null };

export const EMPTY_RECORD_FORM: RecordForm = {
  student: null,
  activities: [],
  scheduleId: "",
  kind: "present",
  note: "",
  agreed: null,
  state: NO_WORDS,
};

/** The activity that stays chosen in a list, or its first when that one left. */
function chosenIn(activities: RecordActivity[], scheduleId: string): string {
  const isListed = activities.some((activity) => activity.id === scheduleId);
  return isListed ? scheduleId : (activities[0]?.id ?? "");
}

/**
 * The form after a press or an answer. Another student or activity
 * starts without an agreement to replace: that was given for one status
 * of one student at one activity. A list of activities that arrives for
 * a student who is no longer the picked one is dropped. After a record
 * is saved the Keterangan is emptied, and the student and the activity
 * stay, to record the next one.
 */
export function recordFormAfter(
  form: RecordForm,
  event: RecordFormEvent,
): RecordForm {
  if (event.kind === "picked") {
    return { ...EMPTY_RECORD_FORM, kind: form.kind, student: event.student };
  }
  if (event.kind === "listed") {
    if (form.student?.id !== event.studentId) return form;
    const scheduleId = chosenIn(event.activities, form.scheduleId);
    return { ...form, activities: event.activities, scheduleId };
  }
  if (event.kind === "chose") {
    return { ...form, scheduleId: event.scheduleId, agreed: null };
  }
  if (event.kind === "set-kind") return { ...form, kind: event.value };
  if (event.kind === "typed") return { ...form, note: event.note };
  const { state, confirm } = event.answer;
  const note = state.done === null ? form.note : "";
  return { ...form, note, agreed: confirm, state };
}

/** The activity chosen in the form, or undefined while none is. */
export function chosenActivity(form: RecordForm): RecordActivity | undefined {
  return form.activities.find((activity) => activity.id === form.scheduleId);
}
