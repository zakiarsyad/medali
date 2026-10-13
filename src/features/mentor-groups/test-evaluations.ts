import { asc, eq } from "drizzle-orm";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  mentorEvaluationChanges,
  mentorEvaluations,
} from "@/db/schema";
import type { EvaluationScores } from "./evaluation-aspects";
import {
  addTestGroup,
  addTestMentor,
  addTestMentorLine,
  addTestProgram,
} from "./test-records";

/**
 * Made-up records for the checks of evaluations. Each file of checks
 * uses a Tahun akademik and a program name of its own: the database makes
 * two checks that add the same one wait for each other.
 */

export const TEST_SCORES: EvaluationScores = {
  activity: 80,
  attendance: 75,
  achievement: 70,
  feedback: 85,
};

/** An account with these roles, as the one who sends a save. */
export async function addTestEvaluator(
  db: Database,
  roles: RoleId[],
  name = "Akun Uji Evaluasi",
  studyProgramId: number | null = null,
): Promise<AccountForAccess> {
  const id = await addTestMentor(db, { name });
  return { id, roles, studyProgramId, studentId: null };
}

export interface TestPeriods {
  /** A day in the running period. */
  day: string;
  runningId: string;
  beforeId: string;
  /** The period before the one before, which is not offered. */
  olderId: string;
  /** A period that has not started on `day`. */
  laterId: string;
}

async function addTestPeriod(
  db: Database,
  startYear: number,
  term: "odd" | "even",
): Promise<string> {
  const odd = {
    startsOn: `${startYear}-08-01`,
    endsOn: `${startYear + 1}-01-31`,
  };
  const even = {
    startsOn: `${startYear + 1}-02-01`,
    endsOn: `${startYear + 1}-07-31`,
  };
  const days = term === "odd" ? odd : even;
  const [period] = await db
    .insert(academicPeriods)
    .values({ startYear, term, ...days })
    .returning({ id: academicPeriods.id });
  if (!period) throw new Error("The period was not added.");
  return period.id;
}

/**
 * Four periods in a row from Ganjil of a year, with a day in the third
 * of them: that one runs, the second came before it.
 */
export async function addTestPeriods(
  db: Database,
  startYear: number,
): Promise<TestPeriods> {
  return {
    olderId: await addTestPeriod(db, startYear, "odd"),
    beforeId: await addTestPeriod(db, startYear, "even"),
    runningId: await addTestPeriod(db, startYear + 1, "odd"),
    laterId: await addTestPeriod(db, startYear + 1, "even"),
    day: `${startYear + 1}-10-13`,
  };
}

export interface TestHeldGroup {
  groupId: string;
  mentorId: string;
  studyProgramId: number;
}

/** A group of a program of its own, with a mentor who holds it today. */
export async function addTestHeldGroup(
  db: Database,
  programName: string,
  mentorName: string,
): Promise<TestHeldGroup> {
  const studyProgramId = await addTestProgram(db, programName);
  const groupId = await addTestGroup(db, studyProgramId);
  const mentorId = await addTestMentor(db, { name: mentorName });
  await addTestMentorLine(db, groupId, mentorId);
  return { groupId, mentorId, studyProgramId };
}

export function testEvaluationsOf(db: Database, groupId: string) {
  return db
    .select()
    .from(mentorEvaluations)
    .where(eq(mentorEvaluations.groupId, groupId));
}

/** The log lines of the evaluations of a group, the oldest first. */
export function testLogOf(db: Database, groupId: string) {
  return db
    .select({ line: mentorEvaluationChanges })
    .from(mentorEvaluationChanges)
    .innerJoin(
      mentorEvaluations,
      eq(mentorEvaluations.id, mentorEvaluationChanges.evaluationId),
    )
    .where(eq(mentorEvaluations.groupId, groupId))
    .orderBy(asc(mentorEvaluationChanges.changedAt));
}
