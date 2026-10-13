import { MEETINGS_PER_PERIOD } from "@/mentoring/meeting-ids";
import { NumberCard, NumberCards, WordsCard } from "@/ui/number-cards";
import { shownAverage } from "./attendance-average";

/** The numbers above the cards of one group. */
export function MeetingNumbers({
  held,
  periodTitle,
  members,
  groupCode,
  average,
  mentor,
}: {
  /** How many meetings of the period are filled in. */
  held: number;
  /** The running period as the screens name it. */
  periodTitle: string;
  /** How many Aktif members the group has. */
  members: number;
  groupCode: string;
  /** The average as a whole percent, or null for none yet. */
  average: number | null;
  /** The mentor of today with the gelar, or a dash. */
  mentor: string;
}) {
  return (
    <NumberCards>
      <NumberCard
        label="Pertemuan terlaksana"
        amount={`${held} / ${MEETINGS_PER_PERIOD}`}
        note={`semester ${periodTitle}`}
      />
      <NumberCard label="Anak asuh" amount={members} note={groupCode} />
      <NumberCard
        label="Rerata kehadiran pengasuhan"
        amount={shownAverage(average)}
        note="izin dan sakit tidak dihitung"
      />
      <WordsCard label="Pengasuh" words={mentor} />
    </NumberCards>
  );
}
