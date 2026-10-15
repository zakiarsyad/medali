import { periodTitle } from "@/academic-periods/period-labels";
import { rerataOf } from "@/character-scores/assessment-score";
import { shownRerata } from "@/character-scores/shown-rerata";
import shared from "@/ui/data-screen.module.css";
import { DAY } from "@/ui/day";
import { MEDALI_VALUES } from "@/ui/medali-values";
import { ModalDialog } from "@/ui/modal-dialog";
import { type AssessmentParams, assessmentAddress } from "./assessment-address";
import type { AssessmentHistory, HistoryEntry } from "./assessment-history";
import { SOURCE_WORDS } from "./assessment-words";
import styles from "./character-assessment.module.css";
import { PredicateBadge } from "./predicate-badge";

function EntryRow({
  entry,
  withNotes,
}: {
  entry: HistoryEntry;
  withNotes: boolean;
}) {
  const rerata = rerataOf(entry.scores);
  return (
    <tr>
      <td className={shared.rowHeading} data-title="Tanggal">
        {DAY.format(entry.enteredAt)}
        <small className={shared.detail}>{periodTitle(entry.period)}</small>
      </td>
      <td data-title="Sumber">
        {SOURCE_WORDS[entry.source]}
        <small className={`${shared.detail} ${shared.typed}`}>
          {entry.enteredBy}
        </small>
      </td>
      {MEDALI_VALUES.map(({ key, name }) => (
        <td key={key} data-title={name}>
          {entry.scores[key]}
        </td>
      ))}
      <td className={styles.strong} data-title="Rerata">
        {shownRerata(rerata)}
      </td>
      <td data-title="Predikat">
        <PredicateBadge rerata={rerata} />
      </td>
      {withNotes && (
        <td data-title="Catatan penilai">
          <span className={shared.typed}>{entry.note || "-"}</span>
        </td>
      )}
    </tr>
  );
}

/**
 * The earlier assessments of one student, in a box over the tab, the
 * newest first, each with the period it was made in. "Catatan penilai"
 * shows only for those who may enter an assessment.
 */
export function AssessmentHistoryDialog({
  history,
  params,
  withNotes,
}: {
  history: AssessmentHistory;
  params: AssessmentParams;
  withNotes: boolean;
}) {
  return (
    <ModalDialog
      label="Riwayat asesmen karakter"
      closeAddress={assessmentAddress({ ...params, historyId: null })}
    >
      <h2 className={`${shared.heading} ${shared.typed}`}>{history.name}</h2>
      <p className={styles.sub}>
        {history.nim} · {history.program}
      </p>
      {history.entries.length === 0 ? (
        <p className={shared.empty}>Belum ada hasil asesmen karakter.</p>
      ) : (
        <div className={shared.tableWrap}>
          <table className={`${shared.table} ${shared.stacked}`}>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Sumber</th>
                {MEDALI_VALUES.map(({ key, name }) => (
                  <th key={key}>
                    <abbr title={name}>{key}</abbr>
                  </th>
                ))}
                <th>Rerata</th>
                <th>Predikat</th>
                {withNotes && <th>Catatan penilai</th>}
              </tr>
            </thead>
            <tbody>
              {history.entries.map((entry) => (
                <EntryRow key={entry.id} entry={entry} withNotes={withNotes} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ModalDialog>
  );
}
