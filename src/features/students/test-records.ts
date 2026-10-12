import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  accountRoles,
  accounts,
  mentorGroupMembers,
  mentorGroupMentors,
  mentorGroups,
  students,
  studyPrograms,
} from "@/db/schema";

/** Made-up records for the checks of this area. */

export interface TestActor {
  id: string;
  roles: RoleId[];
}

export async function addTestActor(
  db: Database,
  name: string,
  roles: RoleId[],
): Promise<TestActor> {
  const [account] = await db.insert(accounts).values({ name }).returning();
  if (!account) throw new Error("The account was not added.");
  await db
    .insert(accountRoles)
    .values(roles.map((role) => ({ accountId: account.id, role })));
  return { id: account.id, roles };
}

export async function addTestProgram(
  db: Database,
  name: string,
): Promise<number> {
  const [program] = await db
    .insert(studyPrograms)
    .values({ name, code: name })
    .returning();
  if (!program) throw new Error("The study program was not added.");
  return program.id;
}

type TestStudent = Pick<typeof students.$inferInsert, "nim" | "name"> &
  Partial<typeof students.$inferInsert>;

export async function addTestStudent(
  db: Database,
  studyProgramId: number,
  student: TestStudent,
): Promise<string> {
  const [added] = await db
    .insert(students)
    .values({
      studyProgramId,
      entryPath: "regular",
      sex: "female",
      cohortYear: 2026,
      ...student,
    })
    .returning({ id: students.id });
  if (!added) throw new Error("The student was not added.");
  return added.id;
}

export interface TestMentorGroup {
  /** Tells the group from the others of its program studi. */
  number: number;
  memberIds: string[];
  mentorId: string;
  /** The account that held the group before its mentor of today. */
  earlierMentorId?: string;
}

const TEST_GROUP_STARTS_ON = "2026-09-01";
const TEST_MENTOR_REPLACED_ON = "2026-10-01";

function mentorLinesOf(groupId: string, group: TestMentorGroup) {
  if (group.earlierMentorId === undefined) {
    return [
      { groupId, mentorId: group.mentorId, startsOn: TEST_GROUP_STARTS_ON },
    ];
  }
  return [
    {
      groupId,
      mentorId: group.earlierMentorId,
      startsOn: TEST_GROUP_STARTS_ON,
      endsOn: TEST_MENTOR_REPLACED_ON,
      endReason: "Uji penggantian",
    },
    { groupId, mentorId: group.mentorId, startsOn: TEST_MENTOR_REPLACED_ON },
  ];
}

export async function addTestMentorGroup(
  db: Database,
  studyProgramId: number,
  group: TestMentorGroup,
): Promise<string> {
  const [added] = await db
    .insert(mentorGroups)
    .values({
      studyProgramId,
      cohortYear: 2026,
      entryPath: "regular",
      number: group.number,
      startsOn: TEST_GROUP_STARTS_ON,
    })
    .returning({ id: mentorGroups.id });
  if (!added) throw new Error("The mentor group was not added.");
  const members = group.memberIds.map((studentId) => ({
    studentId,
    groupId: added.id,
  }));
  if (members.length > 0) await db.insert(mentorGroupMembers).values(members);
  await db.insert(mentorGroupMentors).values(mentorLinesOf(added.id, group));
  return added.id;
}
