import { and, desc, eq, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { AcademicPeriod } from "@/academic-periods/academic-period";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  accounts,
  mentorEvaluations,
  mentorGroups,
  studyPrograms,
} from "@/db/schema";
import type { GroupCodeParts } from "@/ui/group-code";
import type { EvaluationScores } from "./evaluation-aspects";
import { groupsVisibleTo } from "./visible-groups";

/** How many evaluations "Evaluasi terbaru" shows. */
export const LATEST_EVALUATIONS = 20;

/** One evaluation as the lists show it. The NIP of nobody is read. */
export interface ListedEvaluation extends EvaluationScores {
  id: string;
  period: Pick<AcademicPeriod, "startYear" | "term">;
  group: GroupCodeParts;
  /** The mentor who was evaluated. */
  mentorName: string;
  note: string | null;
  /** When it was saved last. */
  evaluatedAt: Date;
  evaluatorName: string;
}

const evaluator = alias(accounts, "evaluator");

const ROW = {
  id: mentorEvaluations.id,
  period: {
    startYear: academicPeriods.startYear,
    term: academicPeriods.term,
  },
  group: {
    cohortYear: mentorGroups.cohortYear,
    entryPath: mentorGroups.entryPath,
    number: mentorGroups.number,
    programCode: studyPrograms.code,
  },
  mentorName: accounts.name,
  activity: mentorEvaluations.activity,
  attendance: mentorEvaluations.attendance,
  achievement: mentorEvaluations.achievement,
  feedback: mentorEvaluations.feedback,
  note: mentorEvaluations.note,
  evaluatedAt: mentorEvaluations.evaluatedAt,
  evaluatorName: evaluator.name,
};

/**
 * The evaluations an account with this limit may see that meet a
 * condition, the one saved last first. An evaluation is seen through its
 * group: one of a group outside the limit, or of an ended group, is left
 * out.
 */
function readEvaluations(
  db: Database,
  limit: RowLimit,
  condition: SQL | undefined,
) {
  return db
    .select(ROW)
    .from(mentorEvaluations)
    .innerJoin(mentorGroups, eq(mentorGroups.id, mentorEvaluations.groupId))
    .innerJoin(studyPrograms, eq(studyPrograms.id, mentorGroups.studyProgramId))
    .innerJoin(
      academicPeriods,
      eq(academicPeriods.id, mentorEvaluations.periodId),
    )
    .innerJoin(accounts, eq(accounts.id, mentorEvaluations.mentorId))
    .innerJoin(evaluator, eq(evaluator.id, mentorEvaluations.evaluatedBy))
    .where(and(groupsVisibleTo(limit), condition))
    .orderBy(desc(mentorEvaluations.evaluatedAt), desc(mentorEvaluations.id));
}

/** "Evaluasi terbaru": the 20 evaluations saved last. */
export function listLatestEvaluations(
  db: Database,
  limit: RowLimit,
): Promise<ListedEvaluation[]> {
  return readEvaluations(db, limit, undefined).limit(LATEST_EVALUATIONS);
}
