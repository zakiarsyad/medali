import { and, count, eq, inArray, type SQL } from "drizzle-orm";
import type { AcademicPeriod } from "@/academic-periods/academic-period";
import type { Database } from "@/db/connect";
import { mentoringMeetings, mentoringScores, students } from "@/db/schema";
import { MEETINGS_PER_PERIOD } from "@/mentoring/meeting-ids";
import { fewestFilled, type MentoringProgress } from "./mentee-progress";

/** How many meetings of the period each group has filled in. */
async function readFilled(
  db: Database,
  groupIds: readonly string[],
  periodId: string,
): Promise<Map<string, number>> {
  const rows = await db
    .select({ groupId: mentoringMeetings.groupId, filled: count() })
    .from(mentoringMeetings)
    .where(
      and(
        inArray(mentoringMeetings.groupId, [...groupIds]),
        eq(mentoringMeetings.periodId, periodId),
      ),
    )
    .groupBy(mentoringMeetings.groupId);
  return new Map(rows.map((row) => [row.groupId, row.filled]));
}

/** How many of the anak asuh `mentees` lets through have a score of the period. */
async function countScored(
  db: Database,
  mentees: SQL,
  periodId: string,
): Promise<number> {
  const [found] = await db
    .select({ scored: count() })
    .from(students)
    .innerJoin(
      mentoringScores,
      and(
        eq(mentoringScores.studentId, students.id),
        eq(mentoringScores.periodId, periodId),
      ),
    )
    .where(mentees);
  return found?.scored ?? 0;
}

/**
 * What the Pengasuh has filled in for the running period, or null while
 * none runs: then nothing can be filled in.
 */
export async function readProgress(
  db: Database,
  asked: {
    groupIds: readonly string[];
    mentees: SQL;
    students: number;
    period: AcademicPeriod | null;
  },
): Promise<MentoringProgress | null> {
  const { period } = asked;
  if (period === null) return null;
  const [filled, scored] = await Promise.all([
    readFilled(db, asked.groupIds, period.id),
    countScored(db, asked.mentees, period.id),
  ]);
  return {
    period: { startYear: period.startYear, term: period.term },
    filled: fewestFilled(asked.groupIds, filled),
    meetings: MEETINGS_PER_PERIOD,
    scored,
    students: asked.students,
  };
}
