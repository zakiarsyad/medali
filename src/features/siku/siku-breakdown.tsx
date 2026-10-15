import { ROLES } from "@/auth/roles";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import styles from "./siku.module.css";
import type { SikuKind } from "./siku-ids";
import { isHeldWithin, type SikuTotals, sikuOf } from "./siku-score";
import { basisOf, REASON_WORDS, signedPoints } from "./siku-words";
import type { SikuLine } from "./student-siku";

export const HELD_WITHIN = "Nilai SIKU dibatasi 0–100.";

/** What a line shows in place of a reason the account may not read. */
const WITHHELD_WORDS = "Tidak ditampilkan";

const NONE_YET: Record<SikuKind, string> = {
  gain: "Belum ada penambahan.",
  loss: "Belum ada pengurangan.",
};

function ReasonCells({ line }: { line: SikuLine }) {
  if (line.reason === null) {
    return (
      <>
        <td data-title="Alasan">{WITHHELD_WORDS}</td>
        <td data-title="Keterangan">-</td>
      </>
    );
  }
  const basis = basisOf(line);
  return (
    <>
      <td data-title="Alasan">{REASON_WORDS[line.reason]}</td>
      <td data-title="Keterangan">
        <span className={shared.typed}>
          {line.note === "" ? "-" : line.note}
        </span>
        {basis !== "" && <span className={shared.detail}>Dasar: {basis}</span>}
      </td>
    </>
  );
}

function LineTable({
  lines,
  kind,
}: {
  lines: readonly SikuLine[];
  kind: SikuKind;
}) {
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
          {lines.map((line) => (
            <tr key={line.id}>
              <td data-title="Tanggal">{shownDay(line.day)}</td>
              <ReasonCells line={line} />
              <td className={shared.detail} data-title="Dicatat oleh">
                {ROLES[line.enteredAs].title}
                {line.fromFile && " lewat unggah berkas"}
              </td>
              <td
                className={`${styles.strong} ${kind === "gain" ? styles.gain : styles.loss}`}
                data-title="Poin"
              >
                {signedPoints(line.points, kind)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * The lines of one kind, newest first. With `foldAfter`, a longer list
 * shows that many and folds the rest away behind "Tampilkan semua".
 */
function EntryTable({
  lines,
  kind,
  foldAfter,
}: {
  lines: readonly SikuLine[];
  kind: SikuKind;
  foldAfter: number | null;
}) {
  if (lines.length === 0) {
    return <p className={shared.detail}>{NONE_YET[kind]}</p>;
  }
  if (foldAfter === null || lines.length <= foldAfter) {
    return <LineTable lines={lines} kind={kind} />;
  }
  return (
    <>
      <LineTable lines={lines.slice(0, foldAfter)} kind={kind} />
      <details className={styles.more}>
        <summary className={shared.link}>
          Tampilkan semua ({lines.length.toLocaleString("id-ID")})
        </summary>
        <LineTable lines={lines.slice(foldAfter)} kind={kind} />
      </details>
    </>
  );
}

/**
 * How SIKU akhir is reached: Nilai dasar + Penambahan − Pengurangan =
 * SIKU akhir, then the gains and the losses, each newest first.
 */
export function SikuBreakdown({
  base,
  totals,
  lines,
  foldAfter = null,
}: {
  base: number;
  totals: SikuTotals;
  /** The lines in force, the latest day first. */
  lines: readonly SikuLine[];
  /** How many lines a table shows before the rest is folded, or null for all. */
  foldAfter?: number | null;
}) {
  const final = sikuOf(base, totals);
  const gains = lines.filter((line) => line.kind === "gain");
  const losses = lines.filter((line) => line.kind === "loss");
  return (
    <>
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
      <EntryTable lines={gains} kind="gain" foldAfter={foldAfter} />
      <h3 className={styles.subheading}>Pengurangan</h3>
      <EntryTable lines={losses} kind="loss" foldAfter={foldAfter} />
    </>
  );
}
