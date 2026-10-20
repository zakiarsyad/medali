import {
  type Predicate,
  predicateOf,
  rerataOf,
  rerataTenths,
  type Scores,
  totalOf,
} from "@/character-scores/assessment-score";
import type { students } from "@/db/schema";
import { MEDALI_VALUES } from "@/ui/medali-values";
import { isCounted } from "./member-rules";

/*
 * The averages of the character scores of a group or of a mentor's
 * mentees. Read by the screen parts in the browser, so nothing here may
 * take from the database code.
 */

/** Assessed active members whose latest six scores have the same total. */
export interface SameTotal {
  total: number;
  students: number;
}

/**
 * "Rerata MEDALI" of a group, or "Rerata" of a mentor: the average of the
 * Rerata of each assessed active member, to one decimal. Null when nobody
 * is assessed.
 */
export function averageRerata(members: readonly SameTotal[]): number | null {
  let students = 0;
  let tenths = 0;
  for (const member of members) {
    students += member.students;
    tenths += rerataTenths(member.total) * member.students;
  }
  if (students === 0) return null;
  return Math.round(tenths / students) / 10;
}

/** A member's latest assessment, and the one before it when there is one. */
export interface MemberScores {
  latest: Scores;
  earlier: Scores | null;
}

/** What the medal of a group or of a mentor's mentees shows. */
export interface ScoreSummary {
  /** The average of each value of the latest assessments, to one decimal. */
  values: Scores;
  /** The same of the assessments before, of the members who have one. */
  earlier: Scores | null;
  rerata: number;
  /** How many members hold each predikat. */
  predicates: Record<Predicate, number>;
}

/** The average of each value, to one decimal. Null for no scores. */
function averageValues(all: readonly Scores[]): Scores | null {
  if (all.length === 0) return null;
  const values = { M: 0, E: 0, D: 0, A: 0, L: 0, I: 0 };
  for (const { key } of MEDALI_VALUES) {
    let sum = 0;
    for (const scores of all) sum += scores[key];
    values[key] = Math.round((sum * 10) / all.length) / 10;
  }
  return values;
}

function countPredicates(
  members: readonly MemberScores[],
): Record<Predicate, number> {
  const counts = { gold: 0, silver: 0, bronze: 0, guidance: 0 };
  for (const { latest } of members) counts[predicateOf(rerataOf(latest))]++;
  return counts;
}

/**
 * The medal of assessed active members: the average of each value, the
 * assessment before, Rerata and the predikat of each. Null when nobody is
 * assessed.
 */
export function scoreSummary(
  members: readonly MemberScores[],
): ScoreSummary | null {
  const latest = members.map((member) => member.latest);
  const values = averageValues(latest);
  const totals = latest.map((scores) => ({
    total: totalOf(scores),
    students: 1,
  }));
  const rerata = averageRerata(totals);
  if (values === null || rerata === null) return null;
  const earlier: Scores[] = [];
  for (const member of members) {
    if (member.earlier !== null) earlier.push(member.earlier);
  }
  return {
    values,
    earlier: averageValues(earlier),
    rerata,
    predicates: countPredicates(members),
  };
}

/**
 * Members with the lowest Rerata first, and those not assessed last. A
 * member keeps their place among those with the same Rerata.
 */
export function lowestRerataFirst<Member>(
  members: readonly Member[],
  scoresOf: (member: Member) => Scores | null,
): Member[] {
  const rerataOfMember = (member: Member): number | null => {
    const scores = scoresOf(member);
    return scores === null ? null : rerataOf(scores);
  };
  return [...members].sort((one, other) => {
    const first = rerataOfMember(one);
    const second = rerataOfMember(other);
    if (first === null || second === null) {
      return Number(first === null) - Number(second === null);
    }
    return first - second;
  });
}

/**
 * The medal of the members who count in a group, those on Cuti left out,
 * from the assessments of those who have one.
 */
export function activeSummary(
  members: readonly ({ id: string } & Pick<
    typeof students.$inferSelect,
    "status"
  >)[],
  scores: Map<string, MemberScores>,
): ScoreSummary | null {
  const assessed: MemberScores[] = [];
  for (const member of members) {
    const found = scores.get(member.id);
    if (isCounted(member) && found) assessed.push(found);
  }
  return scoreSummary(assessed);
}
