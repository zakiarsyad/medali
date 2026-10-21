import type { AccountForAccess } from "@/auth/access";
import type { Scores } from "@/character-scores/assessment-score";
import type { Database } from "@/db/connect";
import { academicPeriods, characterAssessments } from "@/db/schema";

/** Made-up periods and assessments for the checks of calls from Asesmen karakter. */

/** Scores 55, 58, 60, 57, 59 and 61: Rerata 58.3, Intensif, weakest Mandiri. */
export const INTENSIVE_SCORES: Scores = {
  M: 55,
  E: 58,
  D: 60,
  A: 57,
  L: 59,
  I: 61,
};

/** A period of the file's own year: odd from August, even from February after it. */
export async function addTestCallPeriod(
  db: Database,
  year: number,
  term: "odd" | "even",
): Promise<string> {
  const isOdd = term === "odd";
  const [period] = await db
    .insert(academicPeriods)
    .values({
      startYear: year,
      term,
      startsOn: isOdd ? `${year}-08-01` : `${year + 1}-02-01`,
      endsOn: isOdd ? `${year + 1}-01-31` : `${year + 1}-07-31`,
    })
    .returning({ id: academicPeriods.id });
  if (!period) throw new Error("The period was not added.");
  return period.id;
}

export interface TestCallAssessment {
  studentId: string;
  periodId: string;
  scores: Scores;
  enteredAt: Date;
}

export async function addTestCallAssessment(
  db: Database,
  by: AccountForAccess,
  assessment: TestCallAssessment,
): Promise<void> {
  const { scores } = assessment;
  await db.insert(characterAssessments).values({
    id: crypto.randomUUID(),
    studentId: assessment.studentId,
    scoreM: scores.M,
    scoreE: scores.E,
    scoreD: scores.D,
    scoreA: scores.A,
    scoreL: scores.L,
    scoreI: scores.I,
    source: "mentor_observation",
    note: "",
    periodId: assessment.periodId,
    enteredBy: by.id,
    enteredAt: assessment.enteredAt,
  });
}
