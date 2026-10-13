import { daysBefore } from "@/academic-periods/days-before";
import {
  SAMPLE_REPLACED_GROUP,
  type SampleMentorGroup,
} from "./sample-mentor-groups";
import type { SampleStudent } from "./sample-students";
import type { mentoringNotes } from "./schema";

/*
 * Made-up people only. Every note here is invented.
 */

type StoredNote = typeof mentoringNotes.$inferInsert;

type Words = Pick<StoredNote, "kind" | "valueKeys" | "note" | "followUp">;

export interface SampleMentoringNote extends Words {
  /** The NIM of the sample student the note is about. */
  nim: string;
  /** The name of the sample Pengasuh who wrote it. */
  writer: string;
  happenedOn: string;
}

/** One of each kind, with the values the form ticks for that kind. */
const WORDS: Words[] = [
  {
    kind: "individual_counselling",
    valueKeys: ["M", "A"],
    note: "Membahas cara membagi waktu antara kuliah dan kegiatan. Disepakati jadwal belajar mingguan.",
    followUp: "watch_two_weeks",
  },
  {
    kind: "group_mentoring",
    valueKeys: ["L", "I", "E"],
    note: "Diskusi kelompok tentang integritas di lingkungan kerja. Aktif memberi pendapat.",
    followUp: "none",
  },
  {
    kind: "appreciation",
    valueKeys: ["E", "I"],
    note: "Membantu teman sekelas memahami materi menjelang ujian.",
    followUp: "none",
  },
  {
    kind: "attendance_monitoring",
    valueKeys: ["D"],
    note: "Kehadiran kuliah menurun selama tiga pekan. Diingatkan dan diminta menjelaskan alasannya.",
    followUp: "schedule_counselling",
  },
  {
    kind: "discipline_guidance",
    valueKeys: ["D", "I"],
    note: "Terlambat apel pagi dua kali dalam sepekan. Diberi pembinaan secara lisan.",
    followUp: "watch_two_weeks",
  },
  {
    kind: "parent_visit",
    valueKeys: ["M", "E"],
    note: "Berkomunikasi dengan orang tua tentang rencana pendampingan belajar. Orang tua mendukung.",
    followUp: "involve_parents",
  },
];

/** How many members of each sample group have a note. */
const NOTED_PER_GROUP = 3;

/** The notes are a week apart, over this many days before today. */
const DAYS_APART = 7;
const SPREAD_DAYS = 80;

/** What the earlier mentor of the replaced sample group wrote, before leaving. */
export const SAMPLE_NOTE_BY_EARLIER_MENTOR: Words & { happenedOn: string } = {
  kind: "group_mentoring",
  valueKeys: ["L", "I", "E"],
  note: "Sesi refleksi nilai Loyal bersama kelompok. Kelompok menyusun komitmen bersama.",
  followUp: "none",
  happenedOn: "2025-05-20",
};

function wordsAt(place: number): Words {
  const words = WORDS[place % WORDS.length];
  if (words === undefined) throw new Error("There are no sample note words.");
  return words;
}

/** The name of the mentor who held a group on a day, if anyone did. */
function holderOn(group: SampleMentorGroup, day: string): string | null {
  const line = group.mentors.find((mentor) => {
    const hasStarted = mentor.startsOn <= day;
    const hasEnded = mentor.endsOn !== null && mentor.endsOn < day;
    return hasStarted && !hasEnded;
  });
  return line?.name ?? null;
}

function isReplacedGroup(group: SampleMentorGroup): boolean {
  return (
    group.studyProgram === SAMPLE_REPLACED_GROUP.studyProgram &&
    group.cohortYear === SAMPLE_REPLACED_GROUP.cohortYear &&
    group.entryPath === SAMPLE_REPLACED_GROUP.entryPath
  );
}

function activeNims(students: SampleStudent[]): Set<string> {
  const active = students.filter(
    (student) => (student.status ?? "active") === "active",
  );
  return new Set(active.map((student) => student.nim));
}

/** The note of the earlier mentor of the replaced group, about one member. */
function earlierNote(
  group: SampleMentorGroup,
  nim: string | undefined,
): SampleMentoringNote[] {
  if (!isReplacedGroup(group) || nim === undefined) return [];
  const writer = holderOn(group, SAMPLE_NOTE_BY_EARLIER_MENTOR.happenedOn);
  if (writer === null) return [];
  return [{ ...SAMPLE_NOTE_BY_EARLIER_MENTOR, nim, writer }];
}

/**
 * A few made-up notes for each sample group: one for each of its first
 * Aktif members, of every kind in turn, on days spread over the weeks
 * before `day`, by the mentor who held the group on that day. A day on
 * which the group had no mentor yet gets no note. The group whose mentor
 * was replaced also has a note by its earlier mentor.
 */
export function sampleMentoringNotes(
  groups: SampleMentorGroup[],
  students: SampleStudent[],
  day: string,
): SampleMentoringNote[] {
  const active = activeNims(students);
  const notes: SampleMentoringNote[] = [];
  let place = 0;
  for (const group of groups) {
    const noted = group.memberNims
      .filter((nim) => active.has(nim))
      .slice(0, NOTED_PER_GROUP);
    for (const nim of noted) {
      const happenedOn = daysBefore(day, (place * DAYS_APART) % SPREAD_DAYS);
      const writer = holderOn(group, happenedOn);
      if (writer !== null) {
        notes.push({ nim, writer, happenedOn, ...wordsAt(place) });
      }
      place += 1;
    }
    notes.push(...earlierNote(group, noted[0]));
  }
  return notes;
}
