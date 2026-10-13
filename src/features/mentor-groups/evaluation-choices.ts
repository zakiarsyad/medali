import { and, asc, desc, eq, isNull } from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import {
  accounts,
  mentorGroupMentors,
  mentorGroups,
  studyPrograms,
} from "@/db/schema";
import type { GroupCodeParts } from "@/ui/group-code";
import { groupsVisibleTo } from "./visible-groups";

/** A group the form offers, with the name of its mentor of today. */
export interface EvaluationChoice extends GroupCodeParts {
  id: string;
  /** Null for a group that has no mentor today. */
  mentorName: string | null;
}

export interface CohortChoices {
  cohortYear: number;
  groups: EvaluationChoice[];
}

const HELD_TODAY = and(
  eq(mentorGroupMentors.groupId, mentorGroups.id),
  isNull(mentorGroupMentors.endsOn),
);

/**
 * The groups an account with this limit may choose from, the newest
 * angkatan first, then by program studi and number as the list of groups
 * has them.
 */
export function listEvaluationChoices(
  db: Database,
  limit: RowLimit,
): Promise<EvaluationChoice[]> {
  return db
    .select({
      id: mentorGroups.id,
      cohortYear: mentorGroups.cohortYear,
      entryPath: mentorGroups.entryPath,
      number: mentorGroups.number,
      programCode: studyPrograms.code,
      mentorName: accounts.name,
    })
    .from(mentorGroups)
    .innerJoin(studyPrograms, eq(studyPrograms.id, mentorGroups.studyProgramId))
    .leftJoin(mentorGroupMentors, HELD_TODAY)
    .leftJoin(accounts, eq(accounts.id, mentorGroupMentors.mentorId))
    .where(groupsVisibleTo(limit))
    .orderBy(
      desc(mentorGroups.cohortYear),
      asc(studyPrograms.name),
      asc(mentorGroups.entryPath),
      asc(mentorGroups.number),
    );
}

/** The choices under their angkatan, in the order they came. */
export function choicesByCohort(choices: EvaluationChoice[]): CohortChoices[] {
  const cohorts: CohortChoices[] = [];
  for (const choice of choices) {
    const last = cohorts.at(-1);
    if (last && last.cohortYear === choice.cohortYear) {
      last.groups.push(choice);
      continue;
    }
    cohorts.push({ cohortYear: choice.cohortYear, groups: [choice] });
  }
  return cohorts;
}
