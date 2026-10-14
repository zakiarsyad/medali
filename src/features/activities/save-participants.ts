import { and, count, eq, inArray, isNull, type SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { activityScheduleParticipants as chosen, students } from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import type { Parsed } from "@/parsed";
import { choiceOf, type ParticipantChoice } from "./chosen-participants";
import {
  NO_PARTICIPANTS,
  parseParticipants,
  type SentParticipants,
  UNKNOWN_PARTICIPANTS,
} from "./participant-input";

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

/**
 * Whether every student picked one by one is stored and not removed. One
 * who is no longer Aktif may stay picked: a schedule that is changed
 * keeps them listed.
 */
async function areStored(db: Database, choice: ParticipantChoice) {
  if (choice.kind !== "students") return true;
  const stored = await countStudents(
    db,
    and(namedBy(choice), isNull(students.deletedAt)),
  );
  return stored === choice.studentIds.length;
}

/**
 * Checks the Peserta part of a schedule of an extra activity: its shape,
 * that each student picked is stored, and that it holds at least one
 * Aktif student today, as "Sasaran" counts on the form. A class or
 * angkatan that has no student is not refused on its own: one who joins
 * it later takes part.
 */
export async function checkParticipants(
  db: Database,
  sent: SentParticipants,
): Promise<Parsed<ParticipantChoice>> {
  const parsed = parseParticipants(sent);
  if (!parsed.ok) return parsed;
  const choice = parsed.value;
  if (!(await areStored(db, choice))) return UNKNOWN_PARTICIPANTS;
  const active = await countStudents(db, and(ACTIVE_MEMBER, namedBy(choice)));
  if (active === 0) return NO_PARTICIPANTS;
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
