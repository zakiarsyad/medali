import {
  type Predicate,
  predicateOf,
  rerataFromTotal,
  rerataOf,
  rerataTenths,
  type Scores,
} from "@/character-scores/assessment-score";
import { MEDALI_VALUES } from "@/ui/medali-values";

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
  /**
   * Where the members stood before, to one decimal: each average less the
   * average change of the members who have an assessment before. Null
   * when none has one.
   */
  earlier: Scores | null;
  rerata: number;
  /** How many members hold each predikat. */
  predicates: Record<Predicate, number>;
}

/**
 * Assessed active members whose latest six scores have the same total,
 * with their scores added up, so the medal of a whole list is drawn from
 * a few sums instead of a row for each member.
 */
export interface ScoreSums extends SameTotal {
  /** Each value of their latest assessments, added up. */
  latest: Scores;
  /** How many of them have an assessment before the latest one. */
  changed: number;
  /** For those, each value's change from that assessment, added up. */
  change: Scores;
}

function noScores(): Scores {
  return { M: 0, E: 0, D: 0, A: 0, L: 0, I: 0 };
}

/** The sums of every total together. */
interface AllSums {
  assessed: number;
  latest: Scores;
  changed: number;
  change: Scores;
}

function sumsOfAll(sums: readonly ScoreSums[]): AllSums {
  const all: AllSums = {
    assessed: 0,
    latest: noScores(),
    changed: 0,
    change: noScores(),
  };
  for (const row of sums) {
    all.assessed += row.students;
    all.changed += row.changed;
    for (const { key } of MEDALI_VALUES) {
      all.latest[key] += row.latest[key];
      all.change[key] += row.change[key];
    }
  }
  return all;
}

function toOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

/** The average of each value, to one decimal. */
function averageValues(latest: Scores, assessed: number): Scores {
  const values = noScores();
  for (const { key } of MEDALI_VALUES) {
    values[key] = Math.round((latest[key] * 10) / assessed) / 10;
  }
  return values;
}

/**
 * The shape before, taken from the same members as the shape of today:
 * the change of those assessed before stands for the change of all, so a
 * member assessed only once adds no false gain.
 */
function earlierShape(all: AllSums): Scores | null {
  if (all.changed === 0) return null;
  const shape = noScores();
  for (const { key } of MEDALI_VALUES) {
    const average = all.latest[key] / all.assessed;
    shape[key] = toOneDecimal(average - all.change[key] / all.changed);
  }
  return shape;
}

function countPredicates(
  sums: readonly ScoreSums[],
): Record<Predicate, number> {
  const counts = { gold: 0, silver: 0, bronze: 0, guidance: 0 };
  for (const { total, students } of sums) {
    counts[predicateOf(rerataFromTotal(total))] += students;
  }
  return counts;
}

/**
 * The medal of assessed active members: the average of each value, the
 * assessment before, Rerata and the predikat of each. Null when nobody is
 * assessed.
 */
export function scoreSummary(sums: readonly ScoreSums[]): ScoreSummary | null {
  const rerata = averageRerata(sums);
  if (rerata === null) return null;
  const all = sumsOfAll(sums);
  return {
    values: averageValues(all.latest, all.assessed),
    earlier: earlierShape(all),
    rerata,
    predicates: countPredicates(sums),
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
