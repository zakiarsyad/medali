import { INDICATOR_MEANINGS } from "@/mentoring/score-indicators";
import shared from "@/ui/data-screen.module.css";
import styles from "./mentoring.module.css";
import {
  choiceText,
  rowState,
  spokenScore,
  type Typed,
} from "./score-form-values";
import { basedField, keptKey, ROW_INCOMPLETE, scoreField } from "./score-input";
import type { ScoreRow } from "./score-rows";
import { FinalScore, SavedState, ScoreRemark, ScoreTable } from "./score-table";

/** Takes what was chosen in one choice of a row. */
type OnChoose = (row: ScoreRow, place: number, text: string) => void;

/**
 * The state of a row of the form: that its six are not saved yet, that
 * only part of the six are chosen, or what is saved.
 */
function RowRemark({ row, typed }: { row: ScoreRow; typed: Typed }) {
  const state = rowState(row, typed);
  if (state === "unsaved") {
    return <span className={shared.badge}>Belum disimpan</span>;
  }
  if (state === "incomplete") {
    return <span className={styles.boxFault}>{ROW_INCOMPLETE}</span>;
  }
  return <SavedState row={row} />;
}

/**
 * The choice of one member on one indicator, from 1 to 5 with what each
 * means. A choice of a row that is sent carries its name.
 */
function IndicatorChoice({
  row,
  place,
  name,
  typed,
  isSent,
  onChoose,
}: {
  row: ScoreRow;
  place: number;
  name: string;
  typed: Typed;
  isSent: boolean;
  onChoose: OnChoose;
}) {
  return (
    <select
      className={`${shared.input} ${styles.indicatorChoice}`}
      aria-label={`${name} ${row.name}`}
      aria-invalid={rowState(row, typed) === "incomplete" || undefined}
      name={isSent ? scoreField(row.id, place) : undefined}
      value={choiceText(row, typed, place)}
      onChange={(event) => onChoose(row, place, event.target.value)}
    >
      <option value="">-</option>
      {INDICATOR_MEANINGS.map(({ score, meaning }) => (
        <option key={score} value={String(score)}>
          {score} {meaning}
        </option>
      ))}
    </select>
  );
}

/**
 * "Nilai akhir" of a row of the form, which follows its six at once. A
 * row that is sent carries with it what it was opened on, so a score
 * saved in between is not written over.
 */
function FinalOfRow({
  row,
  typed,
  isSent,
}: {
  row: ScoreRow;
  typed: Typed;
  isSent: boolean;
}) {
  return (
    <>
      <FinalScore score={spokenScore(row, typed)} />
      {isSent && (
        <input type="hidden" name={basedField(row.id)} value={keptKey(row)} />
      )}
    </>
  );
}

/**
 * "Nilai anak asuh" for the mentor of the group: six choices for each
 * member, "Nilai akhir" of them, and beside it what the rubric says of
 * it. Only the rows of `sentIds` carry a name, so a save sends nothing of
 * a row that was not changed.
 */
export function ScoreBoxes({
  rows,
  names,
  typed,
  sentIds,
  onChoose,
}: {
  rows: readonly ScoreRow[];
  /** The names of the indicators in force, in their order. */
  names: readonly string[];
  typed: Typed;
  sentIds: readonly string[];
  onChoose: OnChoose;
}) {
  return (
    <ScoreTable
      rows={rows}
      names={names}
      indicatorOf={(row, place) => (
        <IndicatorChoice
          row={row}
          place={place}
          name={names[place] ?? ""}
          typed={typed}
          isSent={sentIds.includes(row.id)}
          onChoose={onChoose}
        />
      )}
      finalOf={(row) => (
        <FinalOfRow row={row} typed={typed} isSent={sentIds.includes(row.id)} />
      )}
      remarkOf={(row) => (
        <ScoreRemark score={spokenScore(row, typed)}>
          <RowRemark row={row} typed={typed} />
        </ScoreRemark>
      )}
    />
  );
}
