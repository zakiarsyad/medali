import { NumberCard, NumberCards } from "@/ui/number-cards";
import type { ClarificationCounts } from "./clarification-counts";
import { CLARIFICATION_DAYS } from "./clarification-time";

/** The four numbers above the clarification cards. */
export function ClarificationNumbersView({
  counts,
}: {
  counts: ClarificationCounts;
}) {
  return (
    <NumberCards>
      <NumberCard
        label="Menunggu verifikasi"
        amount={counts.submitted}
        note="klarifikasi"
      />
      <NumberCard
        label="Diterima"
        amount={counts.accepted}
        note="klarifikasi"
      />
      <NumberCard label="Ditolak" amount={counts.rejected} note="klarifikasi" />
      <NumberCard
        label="Batas pengajuan"
        amount={CLARIFICATION_DAYS}
        note="hari setelah masa unggah foto berakhir"
      />
    </NumberCards>
  );
}
