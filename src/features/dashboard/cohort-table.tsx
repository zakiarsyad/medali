import { PREDICATES } from "@/character-scores/assessment-score";
import scoreStyles from "@/character-scores/character-scores.module.css";
import { PREDICATE_WORDS } from "@/character-scores/predicate-words";
import { shownRerata } from "@/character-scores/shown-rerata";
import { SpreadBar } from "@/character-scores/spread-bar";
import shared from "@/ui/data-screen.module.css";
import { MEDALI_VALUES } from "@/ui/medali-values";
import { averageWords, oneDecimal } from "./achievement-words";
import type { CohortRecap } from "./cohort-recaps";
import { cohortDetail, noCohortWords } from "./cohort-words";
import { ColouredScore } from "./coloured-score";
import styles from "./dashboard.module.css";
import type { RunningPeriod } from "./dashboard-view";

/** An average with the dot of the predikat it would have, named for a reader. */
function ColouredAverage({ average }: { average: number }) {
  return (
    <ColouredScore score={oneDecimal(average)} words={averageWords(average)} />
  );
}

function PredicateLegend() {
  return (
    <ul className={styles.legend}>
      {PREDICATES.map((predicate) => (
        <li key={predicate}>
          <i className={`${scoreStyles.dot} ${scoreStyles[predicate]}`} />
          {PREDICATE_WORDS[predicate]}
        </li>
      ))}
    </ul>
  );
}

function CohortRow({
  row,
  period,
}: {
  row: CohortRecap;
  period: RunningPeriod;
}) {
  const { recap } = row;
  return (
    <tr>
      <td className={shared.rowHeading} data-title="Angkatan">
        <b>Angkatan {row.cohortYear}</b>
        <small className={shared.detail}>{cohortDetail(row, period)}</small>
      </td>
      <td data-title="Jumlah">{recap.assessed.toLocaleString("id-ID")}</td>
      {MEDALI_VALUES.map(({ key, name }) => (
        <td key={key} data-title={name}>
          <ColouredAverage average={recap.averages[key]} />
        </td>
      ))}
      <td data-title="Rerata">
        <b>{shownRerata(recap.rerata)}</b>
      </td>
      <td data-title="Sebaran predikat">
        <SpreadBar spread={recap.spread} />
      </td>
    </tr>
  );
}

/**
 * "Capaian MEDALI per angkatan": for each cohort shown, how many are
 * assessed, the average of each nilai with the dot of its predikat, the
 * Rerata and the predikat spread. On a phone each cohort is a block.
 */
export function CohortTable({
  rows,
  period,
  filtered,
}: {
  rows: readonly CohortRecap[];
  period: RunningPeriod;
  /** Whether a filter is in use, which lets smaller cohorts be shown. */
  filtered: boolean;
}) {
  return (
    <div className={shared.panel}>
      <div className={styles.panelHead}>
        <h3 className={shared.heading}>Capaian MEDALI per angkatan</h3>
        <PredicateLegend />
      </div>
      {rows.length === 0 ? (
        <p className={shared.empty}>{noCohortWords(filtered)}</p>
      ) : (
        <div className={shared.tableWrap}>
          <table className={`${shared.table} ${shared.stacked}`}>
            <thead>
              <tr>
                <th>Angkatan</th>
                <th>Jumlah</th>
                {MEDALI_VALUES.map(({ key, name }) => (
                  <th key={key}>{name}</th>
                ))}
                <th>Rerata</th>
                <th>Sebaran predikat</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <CohortRow
                  key={`${row.cohortYear} ${row.entryPath}`}
                  row={row}
                  period={period}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
