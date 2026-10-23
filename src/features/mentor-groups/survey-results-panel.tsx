import { campusDay } from "@/academic-periods/campus-day";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { database } from "@/db/database";
import {
  type GroupSurveyDetail,
  readGroupSurveyDetail,
} from "./survey-group-detail";
import {
  type ResultPage,
  resultNumbers,
  resultPage,
  rowKey,
} from "./survey-group-list";
import { readSurveyGroupRows } from "./survey-group-reads";
import {
  chooseResultPeriod,
  type ResultPeriod,
  readResultPeriods,
} from "./survey-result-periods";
import type { OpenedRow, SurveyResultChoices } from "./survey-results-address";
import { type ShownResults, SurveyResultsView } from "./survey-results-view";

/** The detail of the row the address opens, when it is a row of the page. */
function readOpenDetail(
  db: Database,
  limit: RowLimit,
  period: ResultPeriod,
  page: ResultPage,
  opened: OpenedRow | null,
): Promise<GroupSurveyDetail | null> {
  if (opened === null) return Promise.resolve(null);
  const key = rowKey(opened.groupId, opened.mentorId);
  if (!page.rows.some((row) => row.key === key)) return Promise.resolve(null);
  return readGroupSurveyDetail(db, limit, period.id, opened);
}

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
  const page = resultPage(rows, choices);
  return {
    period,
    numbers: resultNumbers(rows),
    page,
    detail: await readOpenDetail(db, limit, period, page, choices.opened),
  };
}

/**
 * Reads what "Hasil evaluasi per kelompok" shows for an account with this
 * limit: the periods, then the sums of every group of the one chosen.
 */
export async function SurveyResultsPanel({
  limit,
  choices,
  mayFix,
}: {
  limit: RowLimit;
  choices: SurveyResultChoices;
  /** Whether the account gets "Tetapkan hasil evaluasi". */
  mayFix: boolean;
}) {
  const db = database();
  const periods = await readResultPeriods(db, campusDay());
  const period = chooseResultPeriod(periods, choices.surveyPeriodId);
  const shown =
    period === null ? null : await readShown(db, limit, period, choices);
  return (
    <SurveyResultsView
      periods={periods}
      shown={shown}
      choices={choices}
      mayFix={mayFix}
    />
  );
}
