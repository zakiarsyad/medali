import { desc, eq, isNull } from "drizzle-orm";
import type { AcademicPeriod } from "@/academic-periods/academic-period";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  accounts,
  studentSurveyPeriods,
  surveyResultFixings,
} from "@/db/schema";
import {
  runsWith,
  type SurveyStatus,
  surveyNumbersDay,
  surveyStatus,
} from "@/mentoring/survey-status";

/** Who fixed the results of a period into the evaluation history, and when. */
export interface ResultFixing {
  at: Date;
  byName: string;
}

/** A survey period that "Hasil evaluasi per kelompok" can show. */
export interface ResultPeriod {
  id: string;
  /** "Periode": the academic period the survey is about. */
  period: Pick<AcademicPeriod, "startYear" | "term">;
  startsOn: string;
  endsOn: string;
  achievementWeight: number;
  status: SurveyStatus;
  /** The day its numbers are taken on: today, or its closing day once over. */
  numbersDay: string;
  /** Null while its results are not fixed. */
  fixed: ResultFixing | null;
}

function fixingOf(at: Date | null, byName: string | null): ResultFixing | null {
  if (at === null || byName === null) return null;
  return { at, byName };
}

/**
 * Every survey period that was not cancelled, the latest first: by its
 * first day, and among those of one day the one opened last. The answers
 * of a cancelled period are used nowhere, so it is not offered.
 */
export async function readResultPeriods(
  db: Database,
  today: string,
): Promise<ResultPeriod[]> {
  const stored = await db
    .select({
      id: studentSurveyPeriods.id,
      startYear: academicPeriods.startYear,
      term: academicPeriods.term,
      startsOn: studentSurveyPeriods.startsOn,
      endsOn: studentSurveyPeriods.endsOn,
      achievementWeight: studentSurveyPeriods.achievementWeight,
      closedAt: studentSurveyPeriods.closedAt,
      fixedAt: surveyResultFixings.fixedAt,
      fixerName: accounts.name,
    })
    .from(studentSurveyPeriods)
    .innerJoin(
      academicPeriods,
      eq(academicPeriods.id, studentSurveyPeriods.periodId),
    )
    .leftJoin(
      surveyResultFixings,
      eq(surveyResultFixings.surveyPeriodId, studentSurveyPeriods.id),
    )
    .leftJoin(accounts, eq(accounts.id, surveyResultFixings.fixedBy))
    .where(isNull(studentSurveyPeriods.cancelledAt))
    .orderBy(
      desc(studentSurveyPeriods.startsOn),
      desc(studentSurveyPeriods.openedAt),
    );
  return stored.map(
    ({ startYear, term, closedAt, fixedAt, fixerName, ...rest }) => ({
      ...rest,
      period: { startYear, term },
      status: surveyStatus({ ...rest, closedAt }, today),
      numbersDay: surveyNumbersDay({ ...rest, closedAt }, today),
      fixed: fixingOf(fixedAt, fixerName),
    }),
  );
}

/**
 * The period to show: the one the address names, else the one that runs,
 * else the latest. Null while there is none.
 */
export function chooseResultPeriod(
  periods: readonly ResultPeriod[],
  id: string | null,
): ResultPeriod | null {
  const named = periods.find((period) => period.id === id);
  if (named) return named;
  const running = periods.find((period) => runsWith(period.status));
  if (running) return running;
  return periods[0] ?? null;
}

/**
 * Whether the results of a period may be fixed now: it is Ditutup or
 * Berakhir, and they are not fixed yet.
 */
export function isFixable(
  period: Pick<ResultPeriod, "status" | "fixed">,
): boolean {
  if (period.fixed !== null) return false;
  return period.status === "closed" || period.status === "ended";
}
