import { SCORE_MAX } from "@/mentoring/score-range";
import type { SamplePeriod } from "./sample-data";
import type { SampleMentorGroup } from "./sample-mentor-groups";
import { dayHeld } from "./sample-mentoring-meetings";
import { holderOn } from "./sample-mentoring-notes";
import type { SampleStudent } from "./sample-students";

/*
 * Made-up people only. Every score here is invented.
 */

export interface SampleMentoringScore {
  /** The NIM of the sample student. */
  nim: string;
  score: number;
  /** The day the score was given. */
  scoredOn: string;
  /** The name of the sample Pengasuh who gave it. */
  scoredBy: string;
}

/** How many days ago the sample scores were given. */
const DAYS_AGO = 5;

/** The lowest sample score, and how many scores there are from it up. */
const LOWEST = 55;
const SPREAD = SCORE_MAX - LOWEST + 1;

/**
 * How much of a group is scored, in turn: all of it, half of it, none of
 * it. So the sample has a group that is done, one that is under way and
 * one that is not begun.
 */
const SCORED_PARTS = [1, 0.5, 0];

function activeNims(students: SampleStudent[]): Set<string> {
  const active = students.filter(
    (student) => (student.status ?? "active") === "active",
  );
  return new Set(active.map((student) => student.nim));
}

/** Scores that differ from member to member and reach every band. */
function scoreAt(groupPlace: number, memberPlace: number): number {
  return LOWEST + ((groupPlace * 11 + memberPlace * 17) % SPREAD);
}

/**
 * The scores of the running period for part of the sample groups: every
 * Aktif member of one group, the first half of the next, nobody of the
 * third, and so on, by the mentor who held the group on that day. A group
 * that has no mentor by `day` gets none.
 */
export function sampleMentoringScores(
  groups: SampleMentorGroup[],
  students: SampleStudent[],
  period: SamplePeriod,
  day: string,
): SampleMentoringScore[] {
  const active = activeNims(students);
  const scores: SampleMentoringScore[] = [];
  for (const [groupPlace, group] of groups.entries()) {
    const scoredOn = dayHeld(group, period, day, DAYS_AGO);
    const scoredBy = scoredOn > day ? null : holderOn(group, scoredOn);
    if (scoredBy === null) continue;
    const members = group.memberNims.filter((nim) => active.has(nim));
    const part = SCORED_PARTS[groupPlace % SCORED_PARTS.length] ?? 0;
    const scored = members.slice(0, Math.ceil(members.length * part));
    for (const [memberPlace, nim] of scored.entries()) {
      const score = scoreAt(groupPlace, memberPlace);
      scores.push({ nim, score, scoredOn, scoredBy });
    }
  }
  return scores;
}
