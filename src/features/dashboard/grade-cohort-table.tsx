import { shownOneDecimal } from "@/character-grades/grade-words";
import { GRADE_PARTS, type GradeLetter } from "@/character-grades/scheme-ids";
import shared from "@/ui/data-screen.module.css";
import { averageWords } from "./achievement-words";
import { cohortDetail } from "./cohort-words";
import type { RunningPeriod } from "./dashboard-view";
import type { GradeCohort } from "./grade-recap";
import { noGradeCohortWords, PART_HEADINGS } from "./grade-words";

function GradeCohortRow({
  row,
  period,
  passHeading,
}: {
  row: GradeCohort;
  period: RunningPeriod;
  passHeading: string;
}) {
  const { recap } = row;
  return (
    <tr>
      <td className={shared.rowHeading} data-title="Angkatan">
        <b>Angkatan {row.cohortYear}</b>
        <small className={shared.detail}>{cohortDetail(row, period)}</small>
      </td>
      <td data-title="Jumlah">{recap.graded.toLocaleString("id-ID")}</td>
      {GRADE_PARTS.map((part) => (
        <td key={part} data-title={PART_HEADINGS[part]}>
          {averageWords(recap.parts[part])}
        </td>
      ))}
      <td data-title="Nilai akhir">
        <b>{shownOneDecimal(recap.meanFinal)}</b>
      </td>
      <td data-title={passHeading}>{recap.passing}%</td>
    </tr>
  );
}

/**
 * "Nilai karakter per angkatan": for each cohort shown, how many have a
 * worked-out grade, the average of each part, Rerata nilai akhir and the
 * percent that meets the pass letter. On a phone each cohort is a block.
 */
export function GradeCohortTable({
  rows,
  period,
  filtered,
  passLetter,
}: {
  rows: readonly GradeCohort[];
  period: RunningPeriod;
  /** Whether a filter is in use, which lets smaller cohorts be shown. */
  filtered: boolean;
  passLetter: GradeLetter;
}) {
  const passHeading = `Memenuhi ${passLetter}`;
  return (
    <div className={shared.panel}>
      <h3 className={shared.heading}>Nilai karakter per angkatan</h3>
      {rows.length === 0 ? (
        <p className={shared.empty}>{noGradeCohortWords(filtered)}</p>
      ) : (
        <div className={shared.tableWrap}>
          <table className={`${shared.table} ${shared.stacked}`}>
            <thead>
              <tr>
                <th>Angkatan</th>
                <th>Jumlah</th>
                {GRADE_PARTS.map((part) => (
                  <th key={part}>{PART_HEADINGS[part]}</th>
                ))}
                <th>Nilai akhir</th>
                <th>{passHeading}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <GradeCohortRow
                  key={`${row.cohortYear} ${row.entryPath}`}
                  row={row}
                  period={period}
                  passHeading={passHeading}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
