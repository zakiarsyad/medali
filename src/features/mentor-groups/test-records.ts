import type { Database } from "@/db/connect";
import {
  accounts,
  mentorGroupMembers,
  mentorGroupMentors,
  mentorGroups,
  students,
  studyPrograms,
} from "@/db/schema";

/** Made-up records for the checks of this area. */

export const TEST_GROUP_STARTS_ON = "2026-09-01";

type TestAccount = Pick<typeof accounts.$inferInsert, "name"> &
  Partial<typeof accounts.$inferInsert>;

export async function addTestMentor(
  db: Database,
  account: TestAccount,
): Promise<string> {
  const [added] = await db
    .insert(accounts)
    .values(account)
    .returning({ id: accounts.id });
  if (!added) throw new Error("The account was not added.");
  return added.id;
}

/** A study program whose name is also its code. */
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

type TestGroup = Partial<typeof mentorGroups.$inferInsert>;

/** A group with no member and no mentor yet. */
export async function addTestGroup(
  db: Database,
  studyProgramId: number,
  group: TestGroup = {},
): Promise<string> {
  const [added] = await db
    .insert(mentorGroups)
    .values({
      studyProgramId,
      cohortYear: 2026,
      entryPath: "regular",
      number: 1,
      startsOn: TEST_GROUP_STARTS_ON,
      ...group,
    })
    .returning({ id: mentorGroups.id });
  if (!added) throw new Error("The mentor group was not added.");
  return added.id;
}

export async function addTestMembers(
  db: Database,
  groupId: string,
  studentIds: string[],
): Promise<void> {
  const members = studentIds.map((studentId) => ({ studentId, groupId }));
  await db.insert(mentorGroupMembers).values(members);
}

type TestMentorLine = Partial<typeof mentorGroupMentors.$inferInsert>;

/** A mentor line of a group: the mentor of today unless it has a last day. */
export async function addTestMentorLine(
  db: Database,
  groupId: string,
  mentorId: string,
  line: TestMentorLine = {},
): Promise<void> {
  await db
    .insert(mentorGroupMentors)
    .values({ groupId, mentorId, startsOn: TEST_GROUP_STARTS_ON, ...line });
}

/** Students of one program with the statuses given, as members of a group. */
export async function addTestMembersWithStatus(
  db: Database,
  group: { id: string; studyProgramId: number },
  nimStart: number,
  statuses: (typeof students.$inferInsert)["status"][],
): Promise<string[]> {
  const ids: string[] = [];
  for (const [place, status] of statuses.entries()) {
    const nim = String(nimStart + place);
    const student = { nim, name: `Anggota Uji ${nim}`, status };
    ids.push(await addTestStudent(db, group.studyProgramId, student));
  }
  await addTestMembers(db, group.id, ids);
  return ids;
}
