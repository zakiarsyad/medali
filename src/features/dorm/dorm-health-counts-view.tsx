import shared from "@/ui/data-screen.module.css";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import type { DormHealthNumbersOnly } from "./dorm-health";
import {
  RESIDENT_NOUN,
  reachHint,
  TOO_FEW_LINE,
  withoutNoteHint,
} from "./dorm-health-words";

/**
 * The four numbers for a role that sees numbers only, "<5" for 1 to 4,
 * or only the line that they show from 5 residents on. No name, search
 * or filter.
 */
export function DormHealthCountCards({
  found,
}: {
  found: DormHealthNumbersOnly;
}) {
  const { counts } = found;
  if (counts.kind === "too_few") {
    return <p className={shared.empty}>{TOO_FEW_LINE}</p>;
  }
  const share =
    counts.listedShare === null
      ? {}
      : { note: `${counts.listedShare}% ${RESIDENT_NOUN}` };
  return (
    <NumberCards>
      <NumberCard
        label="Penghuni asrama"
        amount={counts.residents}
        note={reachHint(found.reach)}
      />
      <NumberCard
        label="Sakit atau punya riwayat penyakit"
        amount={counts.listed}
        {...share}
      />
      <NumberCard
        label="Perlu perhatian"
        amount={counts.attention}
        note="pemantauan"
      />
      <NumberCard
        label="Perlu tindak lanjut medis"
        amount={counts.medical}
        note={withoutNoteHint(counts.medicalWithoutNote)}
      />
    </NumberCards>
  );
}
