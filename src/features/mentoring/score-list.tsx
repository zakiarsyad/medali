import { shownPart } from "@/character-grades/grade-words";
import type { ScoreRow } from "./score-rows";
import { SavedState, ScoreRemark, ScoreTable } from "./score-table";

/**
 * "Nilai anak asuh" for an account that only reads the scores of a group:
 * each saved score without a box, with nothing to change and nothing to
 * send.
 */
export function ScoreList({ rows }: { rows: readonly ScoreRow[] }) {
  return (
    <ScoreTable
      rows={rows}
      scoreOf={(row) => <b>{shownPart(row.score)}</b>}
      remarkOf={(row) => (
        <ScoreRemark score={row.score}>
          <SavedState row={row} />
        </ScoreRemark>
      )}
    />
  );
}
