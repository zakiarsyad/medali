import type { ReactNode } from "react";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import type { TabLinksProps } from "@/ui/tab-links";
import { TabbedHead } from "@/ui/tabbed-head";
import type { OwnSiku } from "./own-siku";
import { OwnSikuPanel } from "./own-siku-panel";
import { waitingWords } from "./request-status";
import { sikuOf } from "./siku-score";
import { signedPoints } from "./siku-words";

/**
 * Penilaian SIKU of a student: their four numbers, their requests for a
 * gain, and "Transparansi nilai SIKU".
 */
export function OwnSikuScreen({
  tabs,
  base,
  weight,
  siku,
  requests,
}: {
  tabs: TabLinksProps;
  base: number;
  /** The weight of SIKU in the grade scheme in force. */
  weight: number;
  siku: OwnSiku;
  /**
   * "Ajukan penambahan SIKU" and "Pengajuan saya" with how many requests
   * wait, or null for a student who may not ask.
   */
  requests: { panels: ReactNode; waiting: number } | null;
}) {
  const { totals } = siku;
  const final = sikuOf(base, totals);
  return (
    <>
      <TabbedHead
        title="Penilaian"
        tabs={tabs}
        lede="Nilai sikap dan perilaku (SIKU) Anda: nilai dasar yang sama untuk semua mahasiswa, ditambah dan dikurangi sesuai catatan di bawah."
      />
      <NumberCards>
        <NumberCard
          label="Nilai dasar SIKU"
          amount={base}
          note="sama untuk semua mahasiswa"
        />
        <NumberCard
          label="Penambahan"
          amount={totals.gains === 0 ? "0" : signedPoints(totals.gains, "gain")}
          note="poin"
        />
        <NumberCard
          label="Pengurangan"
          amount={
            totals.losses === 0 ? "0" : signedPoints(totals.losses, "loss")
          }
          note="poin"
        />
        <NumberCard
          label="SIKU akhir"
          amount={final}
          note={
            requests === null
              ? "nilai dasar + penambahan − pengurangan"
              : waitingWords(requests.waiting)
          }
        />
      </NumberCards>
      {requests?.panels}
      <OwnSikuPanel base={base} weight={weight} siku={siku} />
    </>
  );
}
