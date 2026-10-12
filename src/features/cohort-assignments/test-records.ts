import type { RowLimit } from "@/auth/access";
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

/**
 * Made-up records for the checks of this area. Each file of checks uses
 * an angkatan, a program name and NIMs of its own: the database makes two
 * checks that add the same one wait for each other.
 */

export const TEST_STARTS_ON = "2041-09-01";

export function onlyProgram(id: number): RowLimit {
  return { kind: "some", studyProgramIds: [id], menteesOf: [], studentIds: [] };
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

export interface TestActor {
  id: string;
  roles: RoleId[];
}

/** A staff account with these roles, as the one who sends a save. */
export async function addTestActor(
  db: Database,
  roles: RoleId[],
  name = "Akun Uji Penetapan",
): Promise<TestActor> {
  const [account] = await db
    .insert(accounts)
    .values({ name })
    .returning({ id: accounts.id });
  if (!account) throw new Error("The account was not added.");
  await db
    .insert(accountRoles)
    .values(roles.map((role) => ({ accountId: account.id, role })));
  return { id: account.id, roles };
}

type TestMentor = Pick<typeof accounts.$inferInsert, "name"> &
  Partial<typeof accounts.$inferInsert>;

/** A staff account with the Pengasuh role. */
export async function addTestMentor(
  db: Database,
  mentor: TestMentor,
): Promise<string> {
  const [account] = await db
    .insert(accounts)
    .values(mentor)
    .returning({ id: accounts.id });
  if (!account) throw new Error("The mentor was not added.");
  await db
    .insert(accountRoles)
    .values({ accountId: account.id, role: "mentor" });
  return account.id;
}

type TestStudent = Partial<typeof students.$inferInsert>;

/**
 * This many Aktif students of one program, with NIMs that follow each
 * other from the first one given. Every second one is a putra.
 */
export async function addTestStudents(
  db: Database,
  studyProgramId: number,
  count: number,
  firstNim: number,
  more: TestStudent = {},
): Promise<string[]> {
  if (count === 0) return [];
  const rows = Array.from({ length: count }, (_, place) => ({
    nim: String(firstNim + place),
    name: `Mahasiswa Uji ${firstNim + place}`,
    studyProgramId,
    entryPath: "regular" as const,
    sex: place % 2 === 0 ? ("female" as const) : ("male" as const),
    cohortYear: 2041,
    ...more,
  }));
  const added = await db
    .insert(students)
    .values(rows)
    .returning({ id: students.id });
  return added.map((student) => student.id);
}

interface TestLiveGroup {
  cohortYear?: number;
  number?: number;
  /** A group whose penetapan was cancelled. */
  isEnded?: boolean;
}

/** A kelompok pengasuhan with no member and no mentor yet. */
export async function addTestLiveGroup(
  db: Database,
  studyProgramId: number,
  { cohortYear = 2041, number = 1, isEnded = false }: TestLiveGroup = {},
): Promise<string> {
  const ender = isEnded ? await addTestActor(db, ["head_of_unit"]) : null;
  const [group] = await db
    .insert(mentorGroups)
    .values({
      studyProgramId,
      cohortYear,
      entryPath: "regular",
      number,
      startsOn: TEST_STARTS_ON,
      endedAt: ender ? new Date() : null,
      endedBy: ender?.id ?? null,
    })
    .returning({ id: mentorGroups.id });
  if (!group) throw new Error("The mentor group was not added.");
  return group.id;
}

export async function addTestGroupMembers(
  db: Database,
  groupId: string,
  studentIds: string[],
): Promise<void> {
  const members = studentIds.map((studentId) => ({ studentId, groupId }));
  await db.insert(mentorGroupMembers).values(members);
}

/** Makes an account the mentor of today of a group. */
export async function addTestMentorOfToday(
  db: Database,
  groupId: string,
  mentorId: string,
): Promise<void> {
  await db
    .insert(mentorGroupMentors)
    .values({ groupId, mentorId, startsOn: TEST_STARTS_ON });
}
