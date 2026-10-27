import shared from "@/ui/data-screen.module.css";
import type { ScoreRow } from "./score-rows";
import { FinalScore, SavedState, ScoreRemark, ScoreTable } from "./score-table";

/**
 * One indicator score of a row that only reads, or a dash for none. A
 * score given with another name than the one in force says the name it
 * was given with.
 */
function IndicatorScore({
  row,
  place,
  name,
}: {
  row: ScoreRow;
  place: number;
  name: string;
}) {
  const score = row.indicatorScores?.[place];
  if (score === undefined) return <>-</>;
  const givenName = row.indicatorNames?.[place];
  return (
    <>
      {score}
      {givenName && givenName !== name && (
        <small className={shared.detail}>{givenName}</small>
      )}
    </>
  );
}

/**
 * "Nilai anak asuh" for an account that only reads the scores of a group:
 * each saved score without a choice, with nothing to change and nothing
 * to send.
 */
export function ScoreList({
  rows,
  names,
}: {
  rows: readonly ScoreRow[];
  /** The names of the indicators in force, in their order. */
  names: readonly string[];
}) {
  return (
    <ScoreTable
      rows={rows}
      names={names}
      indicatorOf={(row, place) => (
        <IndicatorScore row={row} place={place} name={names[place] ?? ""} />
      )}
      finalOf={(row) => <FinalScore score={row.score} />}
      remarkOf={(row) => (
        <ScoreRemark score={row.score}>
          <SavedState row={row} />
        </ScoreRemark>
      )}
    />
  );
}
