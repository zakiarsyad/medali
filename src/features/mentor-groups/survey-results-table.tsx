import shared from "@/ui/data-screen.module.css";
import { groupCode } from "@/ui/group-code";
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

function Predicate({ result }: { result: SurveyGroupResult }) {
  if (result.result === null) {
    return <span className={styles.quiet}>{missingResultWords(result)}</span>;
  }
  return <ResultBadge result={result.result} />;
}

function ResultRow({ row }: { row: SurveyGroupRow }) {
  const { group, result } = row;
  return (
    <tr>
      <td data-title="Kelompok">
        <b>{groupCode(group)}</b>
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
    </tr>
  );
}

/**
 * The groups of "Hasil evaluasi per kelompok", one row for each group and
 * the mentor its answers count for. A phone shows each as a card.
 */
export function SurveyResultsTable({ rows }: { rows: SurveyGroupRow[] }) {
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
            <ResultRow key={row.key} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
