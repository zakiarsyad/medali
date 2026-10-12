import { asc, eq } from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { mentorGroups, studyPrograms } from "@/db/schema";
import { groupsVisibleTo } from "./visible-groups";

export interface ProgramChoice {
  id: number;
  name: string;
}

/** What the filters above the list offer. */
export interface GroupChoices {
  /** By name. */
  programs: ProgramChoice[];
  /** The newest first. */
  cohortYears: number[];
}

/**
 * The program studi and the angkatan that the groups an account may see
 * belong to, so no filter offers a choice that holds no group.
 */
export async function listGroupChoices(
  db: Database,
  limit: RowLimit,
): Promise<GroupChoices> {
  const rows = await db
    .selectDistinct({
      id: studyPrograms.id,
      name: studyPrograms.name,
      cohortYear: mentorGroups.cohortYear,
    })
    .from(mentorGroups)
    .innerJoin(studyPrograms, eq(studyPrograms.id, mentorGroups.studyProgramId))
    .where(groupsVisibleTo(limit))
    .orderBy(asc(studyPrograms.name));
  const programs = new Map<number, ProgramChoice>();
  const cohortYears = new Set<number>();
  for (const row of rows) {
    programs.set(row.id, { id: row.id, name: row.name });
    cohortYears.add(row.cohortYear);
  }
  return {
    programs: [...programs.values()],
    cohortYears: [...cohortYears].sort((a, b) => b - a),
  };
}
