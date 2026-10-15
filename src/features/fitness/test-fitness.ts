import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  accounts,
  fitnessScores,
  fitnessTests,
  mentorGroupMembers,
  mentorGroupMentors,
  mentorGroups,
} from "@/db/schema";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";

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

/**
 * A program and Aktif students of angkatan 2026 in it, named by place.
 * `nims` are the NIMs of the file's own block.
 */
export async function addTestStudents(
  db: Database,
  program: string,
  nims: string[],
): Promise<{ programId: number; studentIds: string[] }> {
  const programId = await addTestProgram(db, program);
  const studentIds: string[] = [];
  for (const [place, nim] of nims.entries()) {
    studentIds.push(
      await addTestStudent(db, programId, {
        nim,
        name: `Mahasiswa Uji Jasmani ${place + 1}`,
      }),
    );
  }
  return { programId, studentIds };
}

/**
 * A kelompok pengasuhan of angkatan 2026 in force, of some students,
 * held today by a mentor when one is given. `number` tells apart two
 * groups of one program.
 */
export async function addTestGroup(
  db: Database,
  programId: number,
  studentIds: string[],
  more: { mentorId?: string; number?: number } = {},
): Promise<string> {
  const startsOn = "2026-08-01";
  const [group] = await db
    .insert(mentorGroups)
    .values({
      studyProgramId: programId,
      cohortYear: 2026,
      entryPath: "regular",
      number: more.number ?? 1,
      startsOn,
    })
    .returning();
  if (!group) throw new Error("The group was not added.");
  if (studentIds.length > 0) {
    await db
      .insert(mentorGroupMembers)
      .values(
        studentIds.map((studentId) => ({ studentId, groupId: group.id })),
      );
  }
  if (more.mentorId !== undefined) {
    await db
      .insert(mentorGroupMentors)
      .values({ groupId: group.id, mentorId: more.mentorId, startsOn });
  }
  return group.id;
}

export interface TestScores {
  groupId: string;
  testedOn: string;
  enteredAt: Date;
  scores: { studentId: string; score: number }[];
}

/** A save of scores kept as it is, without the rules that check a sent form. */
export async function addTestScores(
  db: Database,
  by: Pick<TestActor, "id">,
  test: TestScores,
): Promise<string> {
  const id = crypto.randomUUID();
  await db.insert(fitnessTests).values({
    id,
    groupId: test.groupId,
    testedOn: test.testedOn,
    enteredBy: by.id,
    enteredAt: test.enteredAt,
  });
  await db
    .insert(fitnessScores)
    .values(test.scores.map((each) => ({ ...each, testId: id })));
  return id;
}
