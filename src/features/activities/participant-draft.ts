import type { ShownChoice } from "./chosen-participants";
import type { ParticipantMode } from "./participant-input";
import type { CohortCount } from "./participants";

/*
 * What the Peserta part of the form holds while it is filled in, and what
 * follows from each pick. Read by the form in the browser: nothing here
 * may take from the database code.
 */

/** A student picked one by one, as the form lists them. */
export interface PickedStudent {
  id: string;
  name: string;
  nim: string;
  /** Aktif and not removed: only then counted in Sasaran. */
  isActive: boolean;
}

/** How many Aktif students one class has. */
export interface ClassCount {
  className: string;
  students: number;
}

/** What the Peserta part offers: the classes and the angkatan, with counts. */
export interface ParticipantPool {
  classes: ClassCount[];
  cohorts: CohortCount[];
}

/**
 * The picks of each kind of choice. Each kind keeps its own while another
 * is shown, as in the prototype; only the shown kind is sent.
 */
export interface ParticipantDraft {
  mode: ParticipantMode;
  students: PickedStudent[];
  classNames: string[];
  cohortYears: number[];
}

/** How many classes the list under "Cari kelas" shows at most. */
export const CLASS_LIST_MAX = 120;

/** A new schedule starts on Per angkatan, as in the prototype, with no pick. */
export const STARTING_DRAFT: ParticipantDraft = {
  mode: "cohort",
  students: [],
  classNames: [],
  cohortYears: [],
};

/**
 * The picks a schedule holds when its form opens to change it. `picked`
 * is the students it names one by one, with their names.
 */
export function draftOf(
  choice: ShownChoice,
  picked: PickedStudent[],
): ParticipantDraft {
  switch (choice.kind) {
    case "students":
      return { ...STARTING_DRAFT, mode: "students", students: picked };
    case "classes":
      return {
        ...STARTING_DRAFT,
        mode: "classes",
        classNames: choice.classNames,
      };
    case "cohorts": {
      const mode = choice.cohortYears.length === 1 ? "cohort" : "cohorts";
      return { ...STARTING_DRAFT, mode, cohortYears: choice.cohortYears };
    }
  }
}

/** Per angkatan holds one angkatan: going to it keeps the first picked. */
export function withMode(
  draft: ParticipantDraft,
  mode: ParticipantMode,
): ParticipantDraft {
  if (mode !== "cohort") return { ...draft, mode };
  return { ...draft, mode, cohortYears: draft.cohortYears.slice(0, 1) };
}

export function withStudent(
  draft: ParticipantDraft,
  student: PickedStudent,
): ParticipantDraft {
  const isPicked = draft.students.some((picked) => picked.id === student.id);
  if (isPicked) return draft;
  return { ...draft, students: [...draft.students, student] };
}

export function withoutStudent(
  draft: ParticipantDraft,
  studentId: string,
): ParticipantDraft {
  const students = draft.students.filter((picked) => picked.id !== studentId);
  return { ...draft, students };
}

function toggled<Value>(values: readonly Value[], value: Value): Value[] {
  if (values.includes(value)) return values.filter((kept) => kept !== value);
  return [...values, value];
}

export function withClassToggled(
  draft: ParticipantDraft,
  className: string,
): ParticipantDraft {
  return { ...draft, classNames: toggled(draft.classNames, className) };
}

/**
 * A press on an angkatan: Per angkatan takes the one pressed in place of
 * any other, and Lintas angkatan ticks it or unticks it.
 */
export function withCohortToggled(
  draft: ParticipantDraft,
  year: number,
): ParticipantDraft {
  if (draft.mode === "cohort") return { ...draft, cohortYears: [year] };
  return { ...draft, cohortYears: toggled(draft.cohortYears, year) };
}

/** What the form sends for the kind shown: keys, class names or years. */
export function sentValues(draft: ParticipantDraft): string[] {
  switch (draft.mode) {
    case "students":
      return draft.students.map((student) => student.id);
    case "classes":
      return draft.classNames;
    case "cohort":
    case "cohorts":
      return draft.cohortYears.map(String);
  }
}

function sumOf<Item>(
  items: readonly Item[],
  isPicked: (item: Item) => boolean,
  countOf: (item: Item) => number,
): number {
  let sum = 0;
  for (const item of items) {
    if (isPicked(item)) sum += countOf(item);
  }
  return sum;
}

/**
 * How many Aktif students the kind shown holds, for "Sasaran": a student
 * picked by name who is no longer Aktif stays listed but is not counted.
 * A student is in one class and one angkatan, so the counts add up.
 */
export function chosenCount(
  draft: ParticipantDraft,
  pool: ParticipantPool,
): number {
  switch (draft.mode) {
    case "students":
      return draft.students.filter((student) => student.isActive).length;
    case "classes":
      return sumOf(
        pool.classes,
        (row) => draft.classNames.includes(row.className),
        (row) => row.students,
      );
    case "cohort":
    case "cohorts":
      return sumOf(
        pool.cohorts,
        (row) => draft.cohortYears.includes(row.cohortYear),
        (row) => row.students,
      );
  }
}

/**
 * The classes offered, by name: those with Aktif students, and those
 * ticked that have none now, so a schedule that is changed still shows
 * each class it holds.
 */
export function classesOffered(
  classes: readonly ClassCount[],
  ticked: readonly string[],
): ClassCount[] {
  const offered = [...classes];
  for (const className of ticked) {
    const isListed = offered.some((row) => row.className === className);
    if (!isListed) offered.push({ className, students: 0 });
  }
  return offered.sort((one, other) =>
    one.className.localeCompare(other.className, "id-ID", { numeric: true }),
  );
}

/** The classes whose name holds what was typed, the first 120 of them. */
export function matchingClasses(
  classes: readonly ClassCount[],
  query: string,
): ClassCount[] {
  const typed = query.trim().toLowerCase();
  const matching = classes.filter((row) =>
    row.className.toLowerCase().includes(typed),
  );
  return matching.slice(0, CLASS_LIST_MAX);
}

/**
 * The angkatan offered, the newest first as in the prototype: those with
 * Aktif students, and those picked that have none now.
 */
export function cohortsOffered(
  cohorts: readonly CohortCount[],
  picked: readonly number[],
): CohortCount[] {
  const offered = [...cohorts];
  for (const cohortYear of picked) {
    const isListed = offered.some((row) => row.cohortYear === cohortYear);
    if (!isListed) offered.push({ cohortYear, students: 0 });
  }
  return offered.sort((one, other) => other.cohortYear - one.cohortYear);
}
