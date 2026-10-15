import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import type { OwnSiku } from "./own-siku";
import { waitingWords } from "./request-status";
import styles from "./siku.module.css";
import { SikuBreakdown } from "./siku-breakdown";
import { GAIN_REASONS, LOSS_REASONS } from "./siku-ids";
import { sikuOf } from "./siku-score";
import { REASON_WORDS, signedPoints } from "./siku-words";

/**
 * Penilaian SIKU of a student: their four numbers, their requests for a
 * gain, and "Transparansi nilai SIKU" with how SIKU akhir is reached,
 * each gain and loss with the role that entered it, and what can add to
 * or reduce SIKU.
 */
export function OwnSikuScreen({
  tabs,
  base,
  siku,
  requests,
}: {
  tabs: TabLinksProps;
  base: number;
  siku: OwnSiku;
  /**
   * "Ajukan penambahan SIKU" and "Pengajuan saya" with how many requests
   * wait, or null for a student who may not ask.
   */
  requests: { panels: ReactNode; waiting: number } | null;
}) {
  const { totals, entries } = siku;
  const final = sikuOf(base, totals);
  const lossWords = LOSS_REASONS.map((reason) =>
    REASON_WORDS[reason].toLowerCase(),
  ).join("; ");
  return (
    <>
      <PageHead title="Penilaian SIKU">
        Nilai sikap dan perilaku (SIKU) Anda: nilai dasar yang sama untuk semua
        mahasiswa, ditambah dan dikurangi sesuai catatan di bawah.
      </PageHead>
      <TabLinks {...tabs} />
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
      <section className={shared.panel}>
        <h2 className={shared.heading}>Transparansi nilai SIKU</h2>
        <SikuBreakdown base={base} totals={totals} lines={entries} />
        <h3 className={styles.subheading}>
          Kegiatan yang dapat menambah nilai SIKU
        </h3>
        <ul className={styles.list}>
          {GAIN_REASONS.map((reason) => (
            <li key={reason}>{REASON_WORDS[reason]}</li>
          ))}
        </ul>
        <p className={styles.sub}>
          Pengurangan dapat terjadi karena: {lossWords}. Bila ada catatan yang
          menurut Anda keliru, hubungi pengasuh atau Penilai Mahasiswa.
        </p>
      </section>
    </>
  );
}
