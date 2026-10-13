import { daysBefore } from "@/academic-periods/days-before";
import type { AttendanceMark } from "@/mentoring/meeting-ids";
import { suggestedTopic } from "@/mentoring/meeting-topics";
import type { SamplePeriod } from "./sample-data";
import type { SampleMentorGroup } from "./sample-mentor-groups";
import { holderOn } from "./sample-mentoring-notes";
import type { SampleStudent } from "./sample-students";

/*
 * Made-up people only. Every meeting and mark here is invented.
 */

export interface SampleMark {
  /** The NIM of the sample student. */
  nim: string;
  mark: AttendanceMark;
}

export interface SampleMentoringMeeting {
  group: SampleMentorGroup;
  number: number;
  heldOn: string;
  topic: string;
  /** The name of the sample Pengasuh who filled it in. */
  savedBy: string;
  marks: SampleMark[];
}

/** The meetings that are filled in, with how many days ago each was held. */
const HELD = [
  { number: 1, daysAgo: 45 },
  { number: 2, daysAgo: 15 },
];

/** One member in this many is away at a meeting, for each reason in turn. */
const ONE_IN = 25;
const AWAY: AttendanceMark[] = ["absent", "sick", "excused"];

function later(a: string, b: string): string {
  return a > b ? a : b;
}

/** Most members came; a few are away, other ones at each meeting. */
function markAt(place: number, number: number): AttendanceMark {
  return AWAY[(place * 7 + number * 5) % ONE_IN] ?? "present";
}

function activeNims(students: SampleStudent[]): Set<string> {
  const active = students.filter(
    (student) => (student.status ?? "active") === "active",
  );
  return new Set(active.map((student) => student.nim));
}

/**
 * The day a sample meeting was held: so many days before `day`, but not
 * before the period began or before the group had its first mentor.
 */
function dayHeld(
  group: SampleMentorGroup,
  period: SamplePeriod,
  day: string,
  daysAgo: number,
): string {
  const firstMentorDay = group.mentors[0]?.startsOn ?? group.startsOn;
  const earliest = later(period.startsOn, firstMentorDay);
  return later(daysBefore(day, daysAgo), earliest);
}

/**
 * Meetings 1 and 2 of the running period for each sample group, with a
 * mark for each of its Aktif members, by the mentor who held the group
 * on that day. A group that has no mentor by `day` gets none.
 */
export function sampleMentoringMeetings(
  groups: SampleMentorGroup[],
  students: SampleStudent[],
  period: SamplePeriod,
  day: string,
): SampleMentoringMeeting[] {
  const active = activeNims(students);
  const meetings: SampleMentoringMeeting[] = [];
  for (const group of groups) {
    const members = group.memberNims.filter((nim) => active.has(nim));
    for (const { number, daysAgo } of HELD) {
      const heldOn = dayHeld(group, period, day, daysAgo);
      const savedBy = heldOn > day ? null : holderOn(group, heldOn);
      if (savedBy === null) continue;
      meetings.push({
        group,
        number,
        heldOn,
        topic: suggestedTopic(number),
        savedBy,
        marks: members.map((nim, place) => ({
          nim,
          mark: markAt(place, number),
        })),
      });
    }
  }
  return meetings;
}
