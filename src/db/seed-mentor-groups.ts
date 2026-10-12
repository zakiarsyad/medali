import { and, inArray, isNull } from "drizzle-orm";
import type { Database } from "./connect";
import {
  type SampleMentorGroup,
  sampleMentorGroups,
} from "./sample-mentor-groups";
import type { SampleStudent } from "./sample-students";
import {
  accounts,
  mentorGroupMembers,
  mentorGroupMentors,
  mentorGroups,
  students,
  studyPrograms,
} from "./schema";

type NewGroup = typeof mentorGroups.$inferInsert;

function idOf<Id>(ids: Map<string, Id>, key: string, what: string): Id {
  const id = ids.get(key);
  if (id === undefined) {
    throw new Error(`A sample mentor group names a ${what} that is missing.`);
  }
  return id;
}

async function programIdsByName(db: Database): Promise<Map<string, number>> {
  const programs = await db.select().from(studyPrograms);
  return new Map(programs.map((program) => [program.name, program.id]));
}

async function studentIdsByNim(db: Database): Promise<Map<string, string>> {
  const found = await db
    .select({ id: students.id, nim: students.nim })
    .from(students);
  return new Map(found.map((student) => [student.nim, student.id]));
}

async function mentorIdsByName(
  db: Database,
  groups: SampleMentorGroup[],
): Promise<Map<string, string>> {
  const names = groups.flatMap((group) =>
    group.mentors.map((mentor) => mentor.name),
  );
  const found = await db
    .select({ id: accounts.id, name: accounts.name })
    .from(accounts)
    .where(and(inArray(accounts.name, names), isNull(accounts.studentId)));
  return new Map(found.map((account) => [account.name, account.id]));
}

/** What tells one group from every other, as the database keeps it. */
function groupKey(group: NewGroup): string {
  return `${group.studyProgramId} ${group.cohortYear} ${group.entryPath} ${group.number}`;
}

function newGroup(
  group: SampleMentorGroup,
  programIds: Map<string, number>,
): NewGroup {
  return {
    studyProgramId: idOf(programIds, group.studyProgram, "study program"),
    cohortYear: group.cohortYear,
    entryPath: group.entryPath,
    number: group.number,
    startsOn: group.startsOn,
  };
}

interface AddedGroup {
  id: string;
  sample: SampleMentorGroup;
}

async function addGroups(
  db: Database,
  groups: SampleMentorGroup[],
): Promise<AddedGroup[]> {
  const programIds = await programIdsByName(db);
  const newGroups = groups.map((group) => newGroup(group, programIds));
  const added = await db.insert(mentorGroups).values(newGroups).returning();
  const ids = new Map(added.map((group) => [groupKey(group), group.id]));
  return groups.map((sample) => ({
    id: idOf(ids, groupKey(newGroup(sample, programIds)), "group"),
    sample,
  }));
}

async function addMembers(db: Database, groups: AddedGroup[]): Promise<void> {
  const studentIds = await studentIdsByNim(db);
  const members = groups.flatMap(({ id, sample }) =>
    sample.memberNims.map((nim) => ({
      groupId: id,
      studentId: idOf(studentIds, nim, "student"),
    })),
  );
  await db.insert(mentorGroupMembers).values(members);
}

async function addMentors(db: Database, groups: AddedGroup[]): Promise<void> {
  const samples = groups.map((group) => group.sample);
  const mentorIds = await mentorIdsByName(db, samples);
  const mentors = groups.flatMap(({ id, sample }) =>
    sample.mentors.map(({ name, ...line }) => ({
      ...line,
      groupId: id,
      mentorId: idOf(mentorIds, name, "Pengasuh"),
    })),
  );
  await db.insert(mentorGroupMentors).values(mentors);
}

/**
 * Adds the sample kelompok pengasuhan of the sample students, each with
 * its members and its mentors. The students and the sample Pengasuh
 * accounts must be there already.
 */
export async function addSampleMentorGroups(
  db: Database,
  sampleStudents: SampleStudent[],
): Promise<void> {
  const groups = sampleMentorGroups(sampleStudents);
  if (groups.length === 0) return;
  const added = await addGroups(db, groups);
  await addMembers(db, added);
  await addMentors(db, added);
}
