import type { RoleId } from "@/auth/role-ids";
import type { Scores } from "@/character-scores/assessment-score";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  accounts,
  characterAssessments,
  mentorGroupMembers,
  mentorGroupMentors,
  mentorGroups,
} from "@/db/schema";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import type { AssessmentSource } from "./assessment-ids";

/** Made-up records for the checks of this area. */

export interface TestActor {
  id: string;
  roles: RoleId[];
  studyProgramId: number | null;
  studentId: string | null;
}

export async function addTestActor(
  db: Database,
  name: string,
  roles: RoleId[],
  more: Partial<Pick<TestActor, "studyProgramId" | "studentId">> = {},
): Promise<TestActor> {
  const [account] = await db
    .insert(accounts)
    .values({ name, ...more })
    .returning();
  if (!account) throw new Error("The account was not added.");
  return {
    id: account.id,
    roles,
    studyProgramId: account.studyProgramId,
    studentId: account.studentId,
  };
}

/** A period of a year far from those of other files: odd, or even after it. */
export async function addTestPeriod(
  db: Database,
  year: number,
  term: "odd" | "even" = "odd",
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
    .returning();
  if (!period) throw new Error("The period was not added.");
  return period.id;
}

/**
 * A program and Aktif students of an angkatan in it, named by place.
 * `nims` are the NIMs of the file's own block.
 */
export async function addTestStudents(
  db: Database,
  program: string,
  year: number,
  nims: string[],
): Promise<{ programId: number; studentIds: string[] }> {
  const programId = await addTestProgram(db, program);
  const studentIds: string[] = [];
  for (const [place, nim] of nims.entries()) {
    studentIds.push(
      await addTestStudent(db, programId, {
        nim,
        name: `Mahasiswa Uji Asesmen ${place + 1}`,
        cohortYear: year,
      }),
    );
  }
  return { programId, studentIds };
}

/** A kelompok pengasuhan of some students, held today by a mentor. */
export async function addTestGroup(
  db: Database,
  of: { programId: number; year: number },
  mentorId: string,
  studentIds: string[],
): Promise<void> {
  const startsOn = `${of.year}-08-01`;
  const [group] = await db
    .insert(mentorGroups)
    .values({
      studyProgramId: of.programId,
      cohortYear: of.year,
      entryPath: "regular",
      number: 1,
      startsOn,
    })
    .returning();
  if (!group) throw new Error("The group was not added.");
  await db
    .insert(mentorGroupMembers)
    .values(studentIds.map((studentId) => ({ studentId, groupId: group.id })));
  await db
    .insert(mentorGroupMentors)
    .values({ groupId: group.id, mentorId, startsOn });
}

export interface TestAssessment {
  studentId: string;
  periodId: string;
  enteredAt: Date;
  scores?: Scores;
  source?: AssessmentSource;
  note?: string;
}

/** Scores 80, 78, 84, 72, 82 and 86: Rerata 80.3, Perak. */
export const SILVER_SCORES: Scores = {
  M: 80,
  E: 78,
  D: 84,
  A: 72,
  L: 82,
  I: 86,
};

/** An assessment kept as it is, without the rules that check a sent form. */
export async function addTestAssessment(
  db: Database,
  by: TestActor,
  assessment: TestAssessment,
): Promise<string> {
  const id = crypto.randomUUID();
  const scores = assessment.scores ?? SILVER_SCORES;
  await db.insert(characterAssessments).values({
    id,
    studentId: assessment.studentId,
    scoreM: scores.M,
    scoreE: scores.E,
    scoreD: scores.D,
    scoreA: scores.A,
    scoreL: scores.L,
    scoreI: scores.I,
    source: assessment.source ?? "mentor_observation",
    note: assessment.note ?? "",
    periodId: assessment.periodId,
    enteredBy: by.id,
    enteredAt: assessment.enteredAt,
  });
  return id;
}
