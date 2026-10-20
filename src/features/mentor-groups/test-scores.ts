import type { Scores } from "@/character-scores/assessment-score";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  characterAssessments,
  type students,
} from "@/db/schema";
import { addTestMembers, addTestMentor, addTestStudent } from "./test-records";

/** Made-up character assessments for the checks of this area. */

/** Six scores that are all the same, so their Rerata is that score. */
export function allScores(score: number): Scores {
  return { M: score, E: score, D: score, A: score, L: score, I: score };
}

export interface TestAssessor {
  periodId: string;
  enteredBy: string;
}

/** A period of a year the test file names, and an account that assesses. */
export async function addTestAssessor(
  db: Database,
  year: number,
): Promise<TestAssessor> {
  const [period] = await db
    .insert(academicPeriods)
    .values({
      startYear: year,
      term: "odd",
      startsOn: `${year}-08-01`,
      endsOn: `${year + 1}-01-31`,
    })
    .returning({ id: academicPeriods.id });
  if (!period) throw new Error("The period was not added.");
  const enteredBy = await addTestMentor(db, { name: "Penilai Uji Rerata" });
  return { periodId: period.id, enteredBy };
}

/** An assessment of a student, kept as it is. */
export async function addTestScores(
  db: Database,
  by: TestAssessor,
  studentId: string,
  scores: Scores,
  enteredAt: Date = new Date("2026-10-01T03:00:00Z"),
): Promise<void> {
  await db.insert(characterAssessments).values({
    id: crypto.randomUUID(),
    studentId,
    scoreM: scores.M,
    scoreE: scores.E,
    scoreD: scores.D,
    scoreA: scores.A,
    scoreL: scores.L,
    scoreI: scores.I,
    source: "mentor_observation",
    note: "",
    periodId: by.periodId,
    enteredBy: by.enteredBy,
    enteredAt,
  });
}

/** A group that scored members are added to, and who assesses them. */
export interface TestGroupOf {
  id: string;
  programId: number;
  by: TestAssessor;
}

/** A member of a group with a latest assessment, or none when null. */
export async function addTestScoredMember(
  db: Database,
  group: TestGroupOf,
  nim: string,
  scores: Scores | null,
  student: Partial<typeof students.$inferInsert> = {},
): Promise<string> {
  const name = `Anggota Uji Rerata ${nim}`;
  const studentId = await addTestStudent(db, group.programId, {
    nim,
    name,
    ...student,
  });
  await addTestMembers(db, group.id, [studentId]);
  if (scores !== null) await addTestScores(db, group.by, studentId, scores);
  return studentId;
}
