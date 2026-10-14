import { and, count, eq, inArray, type SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { activityScheduleParticipants as chosen, students } from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import type { Parsed } from "@/parsed";
import { choiceOf, type ParticipantChoice } from "./chosen-participants";
import { studentsDuring } from "./chosen-students";
import {
  NO_PARTICIPANTS,
  parseParticipants,
  type SentParticipants,
  UNKNOWN_PARTICIPANTS,
} from "./participant-input";
import type { PeriodParts } from "./participants";

/** The students a choice names, as a condition on the students. */
function namedBy(choice: ParticipantChoice): SQL {
  switch (choice.kind) {
    case "students":
      return inArray(students.id, choice.studentIds);
    case "classes":
      return inArray(students.className, choice.classNames);
    case "cohorts":
      return inArray(students.cohortYear, choice.cohortYears);
  }
}

async function countStudents(db: Database, condition: SQL | undefined) {
  const [counted] = await db
    .select({ students: count() })
    .from(students)
    .where(condition);
  return counted?.students ?? 0;
}

/** Where the Peserta part is saved. */
export interface ParticipantPlace {
  /** The period the schedule keeps. */
  period: Pick<PeriodParts, "startYear">;
  /** The schedule being changed, or null for a new one. */
  keptScheduleId: string | null;
}

/** The students a schedule already names one by one: none for a new one. */
async function keptStudentIds(
  db: Database,
  scheduleId: string | null,
): Promise<string[]> {
  if (scheduleId === null) return [];
  const kept = await readStoredChoice(db, scheduleId);
  if (kept?.kind !== "students") return [];
  return kept.studentIds;
}

/**
 * Whether every student picked one by one is known: each new pick is an
 * Aktif student, as the search offers only those. One the schedule
 * already names may stay picked whatever their status, also when removed
 * since: the form keeps them listed until they are taken out.
 */
async function areKnown(
  db: Database,
  choice: ParticipantChoice,
  keptScheduleId: string | null,
) {
  if (choice.kind !== "students") return true;
  const kept = await keptStudentIds(db, keptScheduleId);
  const studentIds = choice.studentIds.filter((id) => !kept.includes(id));
  if (studentIds.length === 0) return true;
  const known = await countStudents(
    db,
    and(ACTIVE_MEMBER, namedBy({ kind: "students", studentIds })),
  );
  return known === studentIds.length;
}

/**
 * Checks the Peserta part of a schedule of an extra activity: its shape,
 * that each student picked is known, and that at least one student takes
 * part today: an Aktif one it names who was a student in the period the
 * schedule keeps, as "(n) peserta" counts them. A class or angkatan that
 * has no student is not refused on its own: one who joins it later takes
 * part.
 */
export async function checkParticipants(
  db: Database,
  sent: SentParticipants,
  place: ParticipantPlace,
): Promise<Parsed<ParticipantChoice>> {
  const parsed = parseParticipants(sent);
  if (!parsed.ok) return parsed;
  const choice = parsed.value;
  if (!(await areKnown(db, choice, place.keptScheduleId))) {
    return UNKNOWN_PARTICIPANTS;
  }
  const takingPart = and(
    ACTIVE_MEMBER,
    namedBy(choice),
    studentsDuring(place.period.startYear),
  );
  if ((await countStudents(db, takingPart)) === 0) return NO_PARTICIPANTS;
  return parsed;
}

/** The choice stored for a schedule, or null when it has none. */
export async function readStoredChoice(
  db: Database,
  scheduleId: string,
): Promise<ParticipantChoice | null> {
  const rows = await db
    .select({
      studentId: chosen.studentId,
      className: chosen.className,
      cohortYear: chosen.cohortYear,
    })
    .from(chosen)
    .where(eq(chosen.scheduleId, scheduleId));
  if (rows.length === 0) return null;
  return choiceOf(rows);
}

function rowsOf(scheduleId: string, choice: ParticipantChoice) {
  switch (choice.kind) {
    case "students":
      return choice.studentIds.map((studentId) => ({ scheduleId, studentId }));
    case "classes":
      return choice.classNames.map((className) => ({ scheduleId, className }));
    case "cohorts":
      return choice.cohortYears.map((cohortYear) => ({
        scheduleId,
        cohortYear,
      }));
  }
}

/**
 * Keeps whom a schedule is for in place of what it held: the rows of the
 * choice, or none for a schedule of a PPKS activity. Meant to run in the
 * transaction that saves the schedule, so the two are never apart.
 */
export async function replaceParticipants(
  db: Database,
  scheduleId: string,
  choice: ParticipantChoice | null,
): Promise<void> {
  await db.delete(chosen).where(eq(chosen.scheduleId, scheduleId));
  if (choice === null) return;
  await db.insert(chosen).values(rowsOf(scheduleId, choice));
}
