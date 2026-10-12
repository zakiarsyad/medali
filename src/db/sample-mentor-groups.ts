import { SAMPLE_ACCOUNTS } from "./sample-data";
import type { SampleStudent } from "./sample-students";

/*
 * Made-up people only. Every group, date and reason here is invented.
 */

/**
 * The sample Pengasuh who hold no group, to show a mentor without one.
 * They are the spare mentors of the sample new angkatan: one of the
 * jurusan of each of its program studi.
 */
export const SAMPLE_MENTORS_WITHOUT_GROUP = ["Taufik Rahmadi", "Yuni Astutik"];

export interface SampleGroupMentor {
  /** The name of a sample Pengasuh account. */
  name: string;
  startsOn: string;
  endsOn: string | null;
  endReason: string | null;
}

export interface SampleMentorGroup {
  studyProgram: string;
  cohortYear: number;
  entryPath: SampleStudent["entryPath"];
  number: number;
  startsOn: string;
  memberNims: string[];
  /** Oldest first. The last one is the mentor of today. */
  mentors: SampleGroupMentor[];
}

type GroupWithoutMentors = Omit<SampleMentorGroup, "mentors">;

/** The one sample group whose first mentor was replaced. */
export const SAMPLE_REPLACED_GROUP = {
  studyProgram: "D3 Pajak",
  cohortYear: 2024,
  entryPath: "regular",
  endsOn: "2025-08-31",
  endReason: "Mutasi ke unit lain",
  replacedOn: "2025-09-01",
} as const;

/** The names of the sample Pengasuh who hold groups, Hendra Wijaya first. */
export function sampleGroupHolders(): string[] {
  return SAMPLE_ACCOUNTS.filter((account) => account.roles.includes("mentor"))
    .map((account) => account.name)
    .filter((name) => !SAMPLE_MENTORS_WITHOUT_GROUP.includes(name));
}

function groupKey(student: SampleStudent): string {
  return `${student.cohortYear} ${student.studyProgram} ${student.entryPath}`;
}

/** One group for each angkatan, program studi and jalur that has students. */
function groupsOf(students: SampleStudent[]): GroupWithoutMentors[] {
  const groups = new Map<string, GroupWithoutMentors>();
  for (const student of students) {
    const key = groupKey(student);
    const group = groups.get(key) ?? {
      studyProgram: student.studyProgram,
      cohortYear: student.cohortYear,
      entryPath: student.entryPath,
      number: 1,
      startsOn: `${student.cohortYear}-09-01`,
      memberNims: [],
    };
    group.memberNims.push(student.nim);
    groups.set(key, group);
  }
  return [...groups.values()];
}

function newestFirst(a: GroupWithoutMentors, b: GroupWithoutMentors): number {
  if (a.cohortYear !== b.cohortYear) return b.cohortYear - a.cohortYear;
  if (a.studyProgram !== b.studyProgram) {
    return a.studyProgram.localeCompare(b.studyProgram);
  }
  return a.entryPath.localeCompare(b.entryPath);
}

function wasReplaced(group: GroupWithoutMentors): boolean {
  return (
    group.studyProgram === SAMPLE_REPLACED_GROUP.studyProgram &&
    group.cohortYear === SAMPLE_REPLACED_GROUP.cohortYear &&
    group.entryPath === SAMPLE_REPLACED_GROUP.entryPath
  );
}

function holderAt(holders: string[], place: number): string {
  const name = holders[place % holders.length];
  if (name === undefined) throw new Error("No sample Pengasuh holds a group.");
  return name;
}

function mentorsOf(
  group: GroupWithoutMentors,
  place: number,
  holders: string[],
): SampleGroupMentor[] {
  const current = holderAt(holders, place);
  if (!wasReplaced(group)) {
    return [
      {
        name: current,
        startsOn: group.startsOn,
        endsOn: null,
        endReason: null,
      },
    ];
  }
  return [
    {
      name: holderAt(holders, place + 1),
      startsOn: group.startsOn,
      endsOn: SAMPLE_REPLACED_GROUP.endsOn,
      endReason: SAMPLE_REPLACED_GROUP.endReason,
    },
    {
      name: current,
      startsOn: SAMPLE_REPLACED_GROUP.replacedOn,
      endsOn: null,
      endReason: null,
    },
  ];
}

/**
 * Puts every student given into the made-up group of their angkatan,
 * program studi and jalur, which starts on 1 September of that angkatan.
 * The groups go to the sample Pengasuh in turn, the newest angkatan
 * first, so the first of them holds one of its large groups.
 */
export function sampleMentorGroups(
  students: SampleStudent[],
): SampleMentorGroup[] {
  const holders = sampleGroupHolders();
  return groupsOf(students)
    .sort(newestFirst)
    .map((group, place) => ({
      ...group,
      mentors: mentorsOf(group, place, holders),
    }));
}
