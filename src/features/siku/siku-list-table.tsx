import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import styles from "./siku.module.css";
import type { SikuListRow } from "./siku-board";
import { REASON_WORDS, signedPoints } from "./siku-words";

export const NO_SIKU_MATCHES = "Tidak ada data pada filter ini.";

/** The latest entry of a student: its day and its reason, or "-". */
function lastWords(row: SikuListRow): string {
  if (row.last === null) return "-";
  return `${shownDay(row.last.day)} · ${REASON_WORDS[row.last.reason]}`;
}

/**
 * "Daftar nilai SIKU": each student with Nilai dasar, Penambahan,
 * Pengurangan, SIKU akhir and Penyesuaian terakhir. On a phone each
 * student is a block of its own.
 */
export function SikuListTable({
  rows,
  base,
}: {
  rows: readonly SikuListRow[];
  base: number;
}) {
  if (rows.length === 0) {
    return <p className={shared.empty}>{NO_SIKU_MATCHES}</p>;
  }
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Nilai dasar</th>
            <th>Penambahan</th>
            <th>Pengurangan</th>
            <th>SIKU akhir</th>
            <th>Penyesuaian terakhir</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className={shared.rowHeading} data-title="Mahasiswa">
                <b className={shared.typed}>{row.name}</b>
                <small className={shared.detail}>
                  {row.nim} · {row.program}
                </small>
              </td>
              <td data-title="Nilai dasar">{base}</td>
              <td className={styles.gain} data-title="Penambahan">
                {signedPoints(row.gains, "gain")}
              </td>
              <td className={styles.loss} data-title="Pengurangan">
                {signedPoints(row.losses, "loss")}
              </td>
              <td className={styles.strong} data-title="SIKU akhir">
                {row.siku}
              </td>
              <td className={shared.detail} data-title="Penyesuaian terakhir">
                {lastWords(row)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
