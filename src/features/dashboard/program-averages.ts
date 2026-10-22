import { rerataTenths } from "@/character-scores/assessment-score";
import { FEWEST_SHOWN } from "./achievement-recap";
import type { ProgramAverage } from "./mentoring-recap";

/**
 * Students of one program studi with the same total of the six scores of
 * their latest assessment, or null for those with none.
 */
export interface ProgramGroup {
  programId: number;
  name: string;
  total: number | null;
  students: number;
}

interface ProgramTally {
  name: string;
  students: number;
  assessed: number;
  tenths: number;
}

function tallied(groups: readonly ProgramGroup[]): Map<number, ProgramTally> {
  const programs = new Map<number, ProgramTally>();
  for (const group of groups) {
    const tally = programs.get(group.programId) ?? {
      name: group.name,
      students: 0,
      assessed: 0,
      tenths: 0,
    };
    tally.students += group.students;
    if (group.total !== null) {
      tally.assessed += group.students;
      tally.tenths += rerataTenths(group.total) * group.students;
    }
    programs.set(group.programId, tally);
  }
  return programs;
}

function averageOf(tally: ProgramTally): number | null {
  if (tally.assessed < FEWEST_SHOWN) return null;
  return Math.round(tally.tenths / tally.assessed) / 10;
}

/** The highest average first, those without one last, then by name. */
function highestFirst(one: ProgramAverage, other: ProgramAverage): number {
  const oneAverage = one.average ?? Number.NEGATIVE_INFINITY;
  const otherAverage = other.average ?? Number.NEGATIVE_INFINITY;
  if (oneAverage !== otherAverage) return otherAverage > oneAverage ? 1 : -1;
  return one.name.localeCompare(other.name, "id");
}

/**
 * "Capaian MEDALI per program studi": each program's Aktif students and
 * the average of their Rerata, added as each student's Rerata shows, so
 * it matches theirs. A program with fewer than `FEWEST_SHOWN` assessed
 * students gets no average, so nobody's own score follows from it.
 */
export function programAverages(
  groups: readonly ProgramGroup[],
): ProgramAverage[] {
  const averages: ProgramAverage[] = [];
  for (const [programId, tally] of tallied(groups)) {
    averages.push({
      programId,
      name: tally.name,
      students: tally.students,
      average: averageOf(tally),
    });
  }
  return averages.sort(highestFirst);
}
