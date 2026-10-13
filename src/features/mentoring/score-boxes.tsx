import shared from "@/ui/data-screen.module.css";
import styles from "./mentoring.module.css";
import {
  boxState,
  boxText,
  spokenScore,
  type Typed,
} from "./score-form-values";
import {
  basedField,
  NOT_A_SCORE,
  SCORE_NOT_EMPTIED,
  scoreField,
} from "./score-input";
import type { ScoreRow } from "./score-rows";
import { SavedState, ScoreRemark, ScoreTable } from "./score-table";

/** Takes what was typed in the box of a student. */
type OnType = (studentId: string, text: string) => void;

/** Whether a box holds what cannot be saved. */
function isFaulty(row: ScoreRow, typed: Typed): boolean {
  const state = boxState(row, typed);
  return state === "invalid" || state === "emptied";
}

/**
 * The state of a row of the form: that its box is not saved yet, why
 * what it holds cannot be saved, or what is saved.
 */
function BoxRemark({ row, typed }: { row: ScoreRow; typed: Typed }) {
  const state = boxState(row, typed);
  if (state === "unsaved") {
    return <span className={shared.badge}>Belum disimpan</span>;
  }
  if (state === "invalid") {
    return <span className={styles.boxFault}>{NOT_A_SCORE}</span>;
  }
  if (state === "emptied") {
    return <span className={styles.boxFault}>{SCORE_NOT_EMPTIED}</span>;
  }
  return <SavedState row={row} />;
}

/**
 * The box of one member. A box that is sent carries its name, and with
 * it goes the score it was opened on, so a score saved in between is
 * not written over.
 */
function ScoreBox({
  row,
  typed,
  isSent,
  onType,
}: {
  row: ScoreRow;
  typed: Typed;
  isSent: boolean;
  onType: OnType;
}) {
  return (
    <>
      <input
        className={`${shared.input} ${styles.scoreBox}`}
        // Not a number box: what is no score stays to be read and corrected.
        inputMode="numeric"
        aria-label={`Nilai pengasuhan ${row.name}`}
        aria-invalid={isFaulty(row, typed) || undefined}
        name={isSent ? scoreField(row.id) : undefined}
        value={boxText(row, typed)}
        onChange={(event) => onType(row.id, event.target.value)}
      />
      {isSent && (
        <input
          type="hidden"
          name={basedField(row.id)}
          value={row.score ?? ""}
        />
      )}
    </>
  );
}

/**
 * "Nilai anak asuh" for the mentor of the group: a box for the score of
 * each member, and beside it what the rubric says of what the box holds.
 * Only the boxes of `sentIds` carry a name, so a save sends nothing of a
 * row that was not changed.
 */
export function ScoreBoxes({
  rows,
  typed,
  sentIds,
  onType,
}: {
  rows: readonly ScoreRow[];
  typed: Typed;
  sentIds: readonly string[];
  onType: OnType;
}) {
  return (
    <ScoreTable
      rows={rows}
      scoreOf={(row) => (
        <ScoreBox
          row={row}
          typed={typed}
          isSent={sentIds.includes(row.id)}
          onType={onType}
        />
      )}
      remarkOf={(row) => (
        <ScoreRemark score={spokenScore(row, typed)}>
          <BoxRemark row={row} typed={typed} />
        </ScoreRemark>
      )}
    />
  );
}
