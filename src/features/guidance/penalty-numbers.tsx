import { NumberCard, NumberCards } from "@/ui/number-cards";
import type { PenaltyNumbers } from "./penalty-board";
import { CHARACTER_SCORE_CAP } from "./penalty-rules";

/** The four numbers of the tab, of the students the account sees. */
export function PenaltyNumbersRow({ numbers }: { numbers: PenaltyNumbers }) {
  const capped = `nilai dibatasi ${CHARACTER_SCORE_CAP}`;
  return (
    <NumberCards>
      <NumberCard
        label="Pelanggaran ringan"
        amount={numbers.light}
        note={capped}
      />
      <NumberCard
        label="Pelanggaran sedang"
        amount={numbers.medium}
        note={capped}
      />
      <NumberCard
        label="Pelanggaran berat"
        amount={numbers.heavy}
        note="skorsing atau diberhentikan"
      />
      <NumberCard
        label="Kerja sosial belum selesai"
        amount={numbers.unfinishedWork}
        note="berakhir hari ini atau sesudahnya"
      />
    </NumberCards>
  );
}
