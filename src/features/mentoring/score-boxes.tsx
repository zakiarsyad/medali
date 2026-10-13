import shared from "@/ui/data-screen.module.css";
import styles from "./mentoring.module.css";
import {
  boxState,
  boxText,
  spokenScore,
  type Typed,
} from "./score-form-values";
import { scoreField } from "./score-input";
import type { ScoreRow } from "./score-rows";
import { SavedState, ScoreRemark, ScoreTable } from "./score-table";

/** Takes what was typed in the box of a student. */
type OnType = (studentId: string, text: string) => void;

/** The state of a row of the form: that its box is not saved yet, or what is saved. */
function BoxRemark({ row, typed }: { row: ScoreRow; typed: Typed }) {
  if (boxState(row, typed) === "unsaved") {
    return <span className={shared.badge}>Belum disimpan</span>;
  }
  return <SavedState row={row} />;
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
        <input
          className={`${shared.input} ${styles.scoreBox}`}
          // Not a number box: what is no score stays to be read and corrected.
          inputMode="numeric"
          aria-label={`Nilai pengasuhan ${row.name}`}
          name={sentIds.includes(row.id) ? scoreField(row.id) : undefined}
          value={boxText(row, typed)}
          onChange={(event) => onType(row.id, event.target.value)}
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
