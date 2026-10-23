import { campusDay } from "@/academic-periods/campus-day";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { database } from "@/db/database";
import { resultNumbers, resultPage } from "./survey-group-list";
import { readSurveyGroupRows } from "./survey-group-reads";
import {
  chooseResultPeriod,
  type ResultPeriod,
  readResultPeriods,
} from "./survey-result-periods";
import type { SurveyResultChoices } from "./survey-results-address";
import { type ShownResults, SurveyResultsView } from "./survey-results-view";

/**
 * The numbers above the table need every group, so all of them are added
 * up on the server, and only one page of them is sent on.
 */
async function readShown(
  db: Database,
  limit: RowLimit,
  period: ResultPeriod,
  choices: SurveyResultChoices,
): Promise<ShownResults> {
  const rows = await readSurveyGroupRows(db, limit, period);
  return {
    period,
    numbers: resultNumbers(rows),
    page: resultPage(rows, choices),
  };
}

/**
 * Reads what "Hasil evaluasi per kelompok" shows for an account with this
 * limit: the periods, then the sums of every group of the one chosen.
 */
export async function SurveyResultsPanel({
  limit,
  choices,
}: {
  limit: RowLimit;
  choices: SurveyResultChoices;
}) {
  const db = database();
  const periods = await readResultPeriods(db, campusDay());
  const period = chooseResultPeriod(periods, choices.surveyPeriodId);
  const shown =
    period === null ? null : await readShown(db, limit, period, choices);
  return (
    <SurveyResultsView periods={periods} shown={shown} choices={choices} />
  );
}
