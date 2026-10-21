import type { Scores } from "@/character-scores/assessment-score";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  accounts,
  characterAssessments,
  fitnessScores,
  fitnessTests,
} from "@/db/schema";

/** Made-up records for the checks of the Dashboard. */

export async function addTestAccount(
  db: Database,
  name: string,
): Promise<string> {
  const [account] = await db
    .insert(accounts)
    .values({ name })
    .returning({ id: accounts.id });
  if (!account) throw new Error("The account was not added.");
  return account.id;
}

/** An odd period of a year far from those of other files. */
export async function addTestPeriod(
  db: Database,
  year: number,
): Promise<string> {
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
  return period.id;
}

/** Every score the same. */
export function evenScores(score: number): Scores {
  return { M: score, E: score, D: score, A: score, L: score, I: score };
}

/** An assessment kept as it is, saved at the moment given. */
export async function addTestAssessment(
  db: Database,
  record: {
    studentId: string;
    periodId: string;
    enteredBy: string;
    enteredAt: Date;
    scores: Scores;
  },
): Promise<void> {
  const { scores } = record;
  await db.insert(characterAssessments).values({
    id: crypto.randomUUID(),
    studentId: record.studentId,
    scoreM: scores.M,
    scoreE: scores.E,
    scoreD: scores.D,
    scoreA: scores.A,
    scoreL: scores.L,
    scoreI: scores.I,
    source: "mentor_observation",
    note: "",
    periodId: record.periodId,
    enteredBy: record.enteredBy,
    enteredAt: record.enteredAt,
  });
}

/** A made-up fingerprint of an uploaded file, as the table asks for one. */
function testFingerprint(): string {
  const hex = () => crypto.randomUUID().replaceAll("-", "");
  return `${hex()}${hex()}`;
}

/** Fitness scores kept as one uploaded file, without the rules that check it. */
export async function addTestFitnessScores(
  db: Database,
  enteredBy: string,
  scores: { studentId: string; score: number }[],
): Promise<void> {
  const id = crypto.randomUUID();
  await db.insert(fitnessTests).values({
    id,
    fileName: "tes-kebugaran-uji.xlsx",
    fingerprint: testFingerprint(),
    testedOn: "2026-09-01",
    enteredBy,
    enteredAt: new Date("2026-09-02T03:00:00Z"),
  });
  await db
    .insert(fitnessScores)
    .values(scores.map((each) => ({ ...each, testId: id })));
}
