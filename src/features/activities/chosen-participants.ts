/*
 * Who takes part in a schedule of a special or additional activity, apart
 * from the database, so the rule can be checked alone. Read by screens in
 * the browser: nothing here may take from the database code.
 */

/**
 * Whom a schedule of a special or additional activity is for: chosen
 * students (Per mahasiswa), classes (Per kelas), or one angkatan (Per
 * angkatan) or more (Lintas angkatan).
 */
export type ParticipantChoice =
  | { kind: "students"; studentIds: string[] }
  | { kind: "classes"; classNames: string[] }
  | { kind: "cohorts"; cohortYears: number[] };

/** What the rule reads of a student. */
export interface CandidateStudent {
  id: string;
  /** Null for a student with no class. */
  className: string | null;
  cohortYear: number;
  /** Aktif, and not removed. */
  isActive: boolean;
}

/**
 * Whether a choice names a student, their class or their angkatan,
 * whatever the student's status. A student chosen by name who is no
 * longer Aktif stays chosen, so they still show among those chosen.
 */
export function isChosen(
  student: CandidateStudent,
  choice: ParticipantChoice,
): boolean {
  switch (choice.kind) {
    case "students":
      return choice.studentIds.includes(student.id);
    case "classes":
      if (student.className === null) return false;
      return choice.classNames.includes(student.className);
    case "cohorts":
      return choice.cohortYears.includes(student.cohortYear);
  }
}

/**
 * Whether a student takes part in a schedule: an Aktif student the choice
 * names, by name, by the class they are in now or by the angkatan they
 * are in now. So a student who joins a chosen class or angkatan later
 * takes part too, and one who is no longer Aktif is not counted.
 */
export function takesPart(
  student: CandidateStudent,
  choice: ParticipantChoice,
): boolean {
  if (!student.isActive) return false;
  return isChosen(student, choice);
}

/**
 * A choice as a list of schedules shows it: the students chosen one by
 * one only by how many there are, so the list names nobody.
 */
export type ShownChoice =
  | { kind: "students"; chosen: number }
  | Exclude<ParticipantChoice, { kind: "students" }>;

export function shownChoiceOf(choice: ParticipantChoice): ShownChoice {
  if (choice.kind !== "students") return choice;
  return { kind: "students", chosen: choice.studentIds.length };
}

/** One stored participant row: it names exactly one of the three. */
export interface StoredParticipant {
  studentId: string | null;
  className: string | null;
  cohortYear: number | null;
}

type ChoiceKind = ParticipantChoice["kind"];

function kindOf(row: StoredParticipant): ChoiceKind {
  if (row.studentId !== null) return "students";
  if (row.className !== null) return "classes";
  if (row.cohortYear !== null) return "cohorts";
  throw new Error("A stored participant names nobody.");
}

function isPresent<Value>(value: Value | null): value is Value {
  return value !== null;
}

/**
 * The choice the stored rows of one schedule make. A schedule always has
 * at least one row, all of one kind: anything else is a fault in what was
 * stored, and is said so.
 */
export function choiceOf(
  rows: readonly StoredParticipant[],
): ParticipantChoice {
  const [first] = rows;
  if (first === undefined) {
    throw new Error("A schedule of an extra activity has no participant.");
  }
  const kind = kindOf(first);
  if (rows.some((row) => kindOf(row) !== kind)) {
    throw new Error("A schedule of an extra activity mixes kinds of choice.");
  }
  switch (kind) {
    case "students":
      return {
        kind,
        studentIds: rows.map((row) => row.studentId).filter(isPresent),
      };
    case "classes":
      return {
        kind,
        classNames: rows.map((row) => row.className).filter(isPresent),
      };
    case "cohorts":
      return {
        kind,
        cohortYears: rows.map((row) => row.cohortYear).filter(isPresent),
      };
  }
}
