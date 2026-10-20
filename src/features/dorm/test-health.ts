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

/** Made-up records for the checks of Asrama > Kesehatan. */

export interface HealthActor {
  id: string;
  roles: RoleId[];
  studyProgramId: number | null;
  studentId: string | null;
}

export async function addHealthActor(
  db: Database,
  name: string,
  roles: RoleId[],
  studyProgramId: number | null = null,
): Promise<HealthActor> {
  const [account] = await db
    .insert(accounts)
    .values({ name, studyProgramId })
    .returning();
  if (!account) throw new Error("The account was not added.");
  return { id: account.id, roles, studyProgramId, studentId: null };
}

/**
 * A kelompok pengasuhan of angkatan 2026 in force, of some students,
 * held today by a mentor when one is given.
 */
export async function addHealthGroup(
  db: Database,
  programId: number,
  studentIds: string[],
  mentorId?: string,
): Promise<string> {
  const startsOn = "2026-08-01";
  const [group] = await db
    .insert(mentorGroups)
    .values({
      studyProgramId: programId,
      cohortYear: 2026,
      entryPath: "regular",
      number: mentorId === undefined ? 2 : 1,
      startsOn,
    })
    .returning();
  if (!group) throw new Error("The group was not added.");
  await db
    .insert(mentorGroupMembers)
    .values(studentIds.map((studentId) => ({ studentId, groupId: group.id })));
  if (mentorId !== undefined) {
    await db
      .insert(mentorGroupMentors)
      .values({ groupId: group.id, mentorId, startsOn });
  }
  return group.id;
}

/** Fitness scores of a group's students, kept as they are. */
export async function addHealthScores(
  db: Database,
  by: { id: string },
  groupId: string,
  scores: { studentId: string; score: number }[],
): Promise<void> {
  const id = crypto.randomUUID();
  await db.insert(fitnessTests).values({
    id,
    groupId,
    testedOn: "2026-10-01",
    enteredBy: by.id,
    enteredAt: new Date("2026-10-01T03:00:00Z"),
  });
  await db
    .insert(fitnessScores)
    .values(scores.map((each) => ({ ...each, testId: id })));
}
