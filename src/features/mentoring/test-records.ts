import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  accounts,
  mentorGroupMembers,
  mentorGroupMentors,
  mentorGroups,
  mentoringNotes,
  students,
  studyPrograms,
} from "@/db/schema";
import type { NoteInput } from "./note-input";

/**
 * Made-up records for the checks of this area. Each file of checks uses
 * a program name and a block of NIMs of its own: the database makes two
 * checks that add the same one wait for each other.
 */

export const TEST_GROUP_STARTS_ON = "2026-09-01";
export const TEST_REPLACED_ON = "2026-10-01";

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

/** A staff account with these roles, as the one who asks or sends. */
export async function addTestAccount(
  db: Database,
  name: string,
  roles: RoleId[],
  studyProgramId: number | null = null,
): Promise<AccountForAccess> {
  const [added] = await db
    .insert(accounts)
    .values({ name, studyProgramId })
    .returning({ id: accounts.id });
  if (!added) throw new Error("The account was not added.");
  return { id: added.id, roles, studyProgramId, studentId: null };
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

export interface TestGroup {
  /** Tells the group from the others of its program studi. */
  number: number;
  memberIds: string[];
  /** The mentor of today. */
  mentorId: string;
  /** The account that held the group before, until it was replaced. */
  earlierMentorId?: string;
}

function mentorLinesOf(groupId: string, group: TestGroup) {
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
      endsOn: TEST_REPLACED_ON,
      endReason: "Uji penggantian",
    },
    { groupId, mentorId: group.mentorId, startsOn: TEST_REPLACED_ON },
  ];
}

export async function addTestMembers(
  db: Database,
  groupId: string,
  studentIds: string[],
): Promise<void> {
  const members = studentIds.map((studentId) => ({ studentId, groupId }));
  await db.insert(mentorGroupMembers).values(members);
}

/** A group with its members and its mentor of today. */
export async function addTestGroup(
  db: Database,
  studyProgramId: number,
  group: TestGroup,
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
  if (group.memberIds.length > 0) {
    await addTestMembers(db, added.id, group.memberIds);
  }
  await db.insert(mentorGroupMentors).values(mentorLinesOf(added.id, group));
  return added.id;
}

/** Gives a group another mentor from a day on, as a replacement does. */
export async function replaceTestMentor(
  db: Database,
  groupId: string,
  newMentorId: string,
  day: string,
): Promise<void> {
  await db
    .update(mentorGroupMentors)
    .set({ endsOn: day, endReason: "Uji penggantian" })
    .where(eq(mentorGroupMentors.groupId, groupId));
  await db
    .insert(mentorGroupMentors)
    .values({ groupId, mentorId: newMentorId, startsOn: day });
}

/** What a mentor sends for one student, with a key of its own. */
export function testNoteInput(
  studentId: string,
  more: Partial<NoteInput> = {},
): NoteInput {
  return {
    id: randomUUID(),
    studentId,
    kind: "individual_counselling",
    happenedOn: "2026-10-10",
    valueKeys: ["M", "A"],
    note: "Membahas jadwal belajar mingguan.",
    followUp: "none",
    ...more,
  };
}

type TestNote = Partial<typeof mentoringNotes.$inferInsert>;

/** A stored note about a student, by a writer. */
export async function addTestNote(
  db: Database,
  studentId: string,
  writtenBy: string,
  more: TestNote = {},
): Promise<string> {
  const { id, ...words } = testNoteInput(studentId);
  await db.insert(mentoringNotes).values({ id, ...words, writtenBy, ...more });
  return more.id ?? id;
}

export function testNotesOf(db: Database, studentId: string) {
  return db
    .select()
    .from(mentoringNotes)
    .where(eq(mentoringNotes.studentId, studentId));
}
