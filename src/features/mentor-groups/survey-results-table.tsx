import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import { groupCode } from "@/ui/group-code";
import { PressableRow } from "@/ui/pressable-row";
import pressable from "@/ui/pressable-row.module.css";
import { ResultBadge } from "./evaluation-badge";
import { programAndCohort } from "./group-list-table";
import styles from "./mentor-groups.module.css";
import { NO_MENTOR } from "./mentor-history";
import type { SurveyGroupRow } from "./survey-group-list";
import type { SurveyGroupResult } from "./survey-result";
import {
  feedbackWords,
  missingResultWords,
  respondentsWords,
  shownNumber,
} from "./survey-result-words";

/** How many columns a row has, which the open detail under it spans. */
const COLUMNS = 7;

function Predicate({ result }: { result: SurveyGroupResult }) {
  if (result.result === null) {
    return <span className={styles.quiet}>{missingResultWords(result)}</span>;
  }
  return <ResultBadge result={result.result} />;
}

function ResultRow({ row, address }: { row: SurveyGroupRow; address: string }) {
  const { group, result } = row;
  return (
    <PressableRow address={address}>
      <td data-title="Kelompok">
        <Link href={address} className={pressable.open} scroll={false}>
          <b>{groupCode(group)}</b>
        </Link>
        <small className={shared.detail}>{programAndCohort(group)}</small>
      </td>
      <td data-title="Pengasuh">{row.mentorName ?? NO_MENTOR}</td>
      <td data-title="Responden">
        {respondentsWords(result.answers, result.members)}
        {result.share !== null && (
          <small className={shared.detail}>{result.share}%</small>
        )}
      </td>
      <td data-title="Capaian karakter">{shownNumber(result.achievement)}</td>
      <td data-title="Umpan balik">
        {feedbackWords(result.feedbackOutOfFive)}
        {result.feedback !== null && (
          <small className={shared.detail}>
            {shownNumber(result.feedback)}
          </small>
        )}
      </td>
      <td data-title="Nilai evaluasi">
        <b>{shownNumber(result.score)}</b>
      </td>
      <td data-title="Predikat">
        <Predicate result={result} />
      </td>
    </PressableRow>
  );
}

/** The row whose detail is open, and what the detail shows. */
export interface OpenDetail {
  key: string;
  detail: ReactNode;
}

/**
 * The groups of "Hasil evaluasi per kelompok", one row for each group and
 * the mentor its answers count for. A phone shows each as a card. A press
 * on a row opens its detail under it, and a press on an open row closes it.
 */
export function SurveyResultsTable({
  rows,
  open,
  addressOf,
}: {
  rows: SurveyGroupRow[];
  open: OpenDetail | null;
  /** The address a press on a row goes to. */
  addressOf: (row: SurveyGroupRow) => string;
}) {
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Kelompok</th>
            <th>Pengasuh</th>
            <th>Responden</th>
            <th>Capaian karakter</th>
            <th>Umpan balik</th>
            <th>Nilai evaluasi</th>
            <th>Predikat</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <Fragment key={row.key}>
              <ResultRow row={row} address={addressOf(row)} />
              {open?.key === row.key && (
                <tr>
                  <td colSpan={COLUMNS}>{open.detail}</td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
