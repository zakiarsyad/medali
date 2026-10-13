import { daysBefore } from "@/academic-periods/days-before";
import { REPLACEMENT_REASON_TITLES } from "@/mentoring/replacement-ids";
import { SAMPLE_ACCOUNTS } from "./sample-data";
import type { SampleStudent } from "./sample-students";

/*
 * Made-up people only. Every group, date and reason here is invented.
 */

/**
 * The sample Pengasuh who hold no group today, to show a mentor without
 * one. They are the spare mentors of the sample new angkatan: one of the
 * jurusan of each of its program studi. The second held a group until the
 * sample replacement.
 */
export const SAMPLE_MENTORS_WITHOUT_GROUP = [
  "Taufik Rahmadi",
  "Slamet Hariyadi",
];

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

/**
 * The sample group whose first mentor left before replacements were kept
 * as records, so it has an earlier mentor and no replacement.
 */
export const SAMPLE_REPLACED_GROUP = {
  studyProgram: "D3 Pajak",
  cohortYear: 2024,
  entryPath: "regular",
  endsOn: "2025-08-31",
  endReason: "Mutasi ke unit lain",
  replacedOn: "2025-09-01",
} as const;

/**
 * The one sample replacement: the group it is about, its two mentors and
 * its reason. The new mentor was a spare mentor of the jurusan of the old
 * one, who held no other group and so is a spare mentor since.
 */
export const SAMPLE_REPLACEMENT = {
  studyProgram: "D3 Pajak",
  cohortYear: 2025,
  entryPath: "regular",
  oldMentor: "Slamet Hariyadi",
  newMentor: "Yuni Astutik",
  reason: "own_request",
} as const;

/** How many days before today the sample replacement started. */
const REPLACED_DAYS_AGO = 30;

/**
 * The day the sample replacement started: some weeks before `day`, but
 * within the calendar year of `day`, where "Penggantian tahun ini" counts
 * it.
 */
export function sampleReplacementDay(day: string): string {
  const weeksAgo = daysBefore(day, REPLACED_DAYS_AGO);
  const newYear = `${day.slice(0, 4)}-01-01`;
  return weeksAgo > newYear ? weeksAgo : newYear;
}

/**
 * The sample Pengasuh whose only group is of the newest angkatan, in the
 * program studi named. Penetapan angkatan baru offers a mentor who holds
 * no group of another angkatan, so this one is offered beside the two
 * without a group.
 */
export const SAMPLE_MENTOR_OF_NEWEST_ONLY = {
  name: "Dian Kusumaningrum",
  studyProgram: "D3 Kepabeanan dan Cukai",
} as const;

/** The names of the sample Pengasuh who hold groups today, Hendra Wijaya first. */
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

type GroupOfCohort = Pick<
  SampleMentorGroup,
  "studyProgram" | "cohortYear" | "entryPath"
>;

/** Whether a group is the one of a program studi, angkatan and jalur. */
export function isGroupOf(group: GroupOfCohort, named: GroupOfCohort): boolean {
  return (
    group.studyProgram === named.studyProgram &&
    group.cohortYear === named.cohortYear &&
    group.entryPath === named.entryPath
  );
}

/**
 * The two lines of the group of the sample replacement. The old mentor's
 * line ends on the day the new mentor's line starts, as a replacement
 * that is carried out leaves them.
 */
function replacedMentors(
  group: GroupWithoutMentors,
  day: string,
): SampleGroupMentor[] {
  const replacedOn = sampleReplacementDay(day);
  return [
    {
      name: SAMPLE_REPLACEMENT.oldMentor,
      startsOn: group.startsOn,
      endsOn: replacedOn,
      endReason: REPLACEMENT_REASON_TITLES[SAMPLE_REPLACEMENT.reason],
    },
    {
      name: SAMPLE_REPLACEMENT.newMentor,
      startsOn: replacedOn,
      endsOn: null,
      endReason: null,
    },
  ];
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
  day: string,
): SampleGroupMentor[] {
  if (isGroupOf(group, SAMPLE_REPLACEMENT)) return replacedMentors(group, day);
  const current = holderAt(holders, place);
  if (!isGroupOf(group, SAMPLE_REPLACED_GROUP)) {
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

function isOfNewestOnly(group: GroupWithoutMentors, newest: number): boolean {
  return (
    group.cohortYear === newest &&
    group.studyProgram === SAMPLE_MENTOR_OF_NEWEST_ONLY.studyProgram
  );
}

function heldByNewestOnly(group: GroupWithoutMentors): SampleMentorGroup {
  const mentor = {
    name: SAMPLE_MENTOR_OF_NEWEST_ONLY.name,
    startsOn: group.startsOn,
    endsOn: null,
    endReason: null,
  };
  return { ...group, mentors: [mentor] };
}

/**
 * Puts every student given into the made-up group of their angkatan,
 * program studi and jalur, which starts on 1 September of that angkatan.
 * One group of the newest angkatan goes to the Pengasuh who holds no
 * other, and the group of the sample replacement to its two mentors. The
 * rest go to the other sample Pengasuh in turn, the newest angkatan
 * first, so the first of them holds one of its large groups. `day` is
 * today on campus, which the day of the sample replacement follows.
 */
export function sampleMentorGroups(
  students: SampleStudent[],
  day: string,
): SampleMentorGroup[] {
  const groups = groupsOf(students).sort(newestFirst);
  const newest = groups[0]?.cohortYear ?? 0;
  const apart = groups.filter((group) => isOfNewestOnly(group, newest));
  const inTurn = groups.filter((group) => !isOfNewestOnly(group, newest));
  const apartNames: string[] = [
    SAMPLE_MENTOR_OF_NEWEST_ONLY.name,
    SAMPLE_REPLACEMENT.newMentor,
  ];
  const holders = sampleGroupHolders().filter(
    (name) => !apartNames.includes(name),
  );
  return [
    ...apart.map(heldByNewestOnly),
    ...inTurn.map((group, place) => ({
      ...group,
      mentors: mentorsOf(group, place, holders, day),
    })),
  ];
}
