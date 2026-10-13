import { MEETINGS_PER_PERIOD } from "@/mentoring/meeting-ids";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import {
  leftWords,
  type ScoresOverview,
  shownScoreAverage,
} from "./scores-overview";

/** The numbers above the scores of one group. */
export function ScoreNumbers({
  overview,
  held,
}: {
  overview: ScoresOverview;
  /** How many meetings of the period are filled in. */
  held: number;
}) {
  return (
    <NumberCards>
      <NumberCard
        label="Sudah dinilai pengasuh"
        amount={`${overview.scored} / ${overview.scored + overview.left}`}
        note={leftWords(overview)}
      />
      <NumberCard
        label="Rerata nilai pengasuhan"
        amount={shownScoreAverage(overview.average)}
        note="dari nilai yang sudah disimpan"
      />
      <NumberCard
        label="Pertemuan terlaksana"
        amount={`${held} / ${MEETINGS_PER_PERIOD}`}
        note="acuan penilaian"
      />
    </NumberCards>
  );
}
