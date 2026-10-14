import type { ReactNode } from "react";
import { ROLES } from "@/auth/roles";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import type { OwnEntry, OwnSiku } from "./own-siku";
import styles from "./siku.module.css";
import { GAIN_REASONS, LOSS_REASONS, type SikuKind } from "./siku-ids";
import { isHeldWithin, sikuOf } from "./siku-score";
import { REASON_WORDS, signedPoints } from "./siku-words";

export const HELD_WITHIN = "Nilai SIKU dibatasi 0–100.";

const NONE_YET: Record<SikuKind, string> = {
  gain: "Belum ada penambahan.",
  loss: "Belum ada pengurangan.",
};

function EntryTable({
  entries,
  kind,
}: {
  entries: readonly OwnEntry[];
  kind: SikuKind;
}) {
  if (entries.length === 0) {
    return <p className={shared.detail}>{NONE_YET[kind]}</p>;
  }
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Alasan</th>
            <th>Keterangan</th>
            <th>Dicatat oleh</th>
            <th>Poin</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td data-title="Tanggal">{shownDay(entry.day)}</td>
              <td data-title="Alasan">{REASON_WORDS[entry.reason]}</td>
              <td data-title="Keterangan">
                <span className={shared.typed}>
                  {entry.note === "" ? "-" : entry.note}
                </span>
                {entry.basis !== "" && (
                  <span className={shared.detail}>Dasar: {entry.basis}</span>
                )}
              </td>
              <td className={shared.detail} data-title="Dicatat oleh">
                {ROLES[entry.enteredAs].title}
                {entry.fromFile && " lewat unggah berkas"}
              </td>
              <td
                className={`${styles.strong} ${kind === "gain" ? styles.gain : styles.loss}`}
                data-title="Poin"
              >
                {signedPoints(entry.points, kind)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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
  /** "Ajukan penambahan SIKU" and "Pengajuan saya", or null for none. */
  requests: ReactNode;
}) {
  const { totals, entries } = siku;
  const final = sikuOf(base, totals);
  const gains = entries.filter((entry) => entry.kind === "gain");
  const losses = entries.filter((entry) => entry.kind === "loss");
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
          note="nilai dasar + penambahan − pengurangan"
        />
      </NumberCards>
      {requests}
      <section className={shared.panel}>
        <h2 className={shared.heading}>Transparansi nilai SIKU</h2>
        <div className={styles.sum}>
          <div>
            <small>Nilai dasar</small>
            <b>{base}</b>
          </div>
          <span className={styles.sign}>+</span>
          <div className={styles.gain}>
            <small>Penambahan ({gains.length})</small>
            <b>{totals.gains}</b>
          </div>
          <span className={styles.sign}>−</span>
          <div className={styles.loss}>
            <small>Pengurangan ({losses.length})</small>
            <b>{totals.losses}</b>
          </div>
          <span className={styles.sign}>=</span>
          <div className={styles.total}>
            <small>SIKU akhir</small>
            <b>{final}</b>
          </div>
        </div>
        {isHeldWithin(base, totals) && (
          <p className={shared.detail}>{HELD_WITHIN}</p>
        )}
        <h3 className={styles.subheading}>Penambahan</h3>
        <EntryTable entries={gains} kind="gain" />
        <h3 className={styles.subheading}>Pengurangan</h3>
        <EntryTable entries={losses} kind="loss" />
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
