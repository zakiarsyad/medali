import type { ReactNode } from "react";
import { StudentLink } from "@/mentoring/student-link";
import shared from "@/ui/data-screen.module.css";
import styles from "./mentoring.module.css";
import { bandOf } from "./score-bands";
import type { ScoreRow } from "./score-rows";

/**
 * "Keterangan" of one row: what the rubric says of the score, and under
 * it the state of the row, such as "Belum dinilai" or the day it was
 * saved. What is no score has no sentence.
 */
export function ScoreRemark({
  score,
  children,
}: {
  score: number | null;
  children: ReactNode;
}) {
  const band = score === null ? null : bandOf(score);
  return (
    <>
      {band && <span>{band.sentence}</span>}
      <span className={shared.detail}>{children}</span>
    </>
  );
}

/** The state of a row that holds what is saved: the day, or that it has no score. */
export function SavedState({ row }: { row: ScoreRow }) {
  if (row.scoredOn === null) {
    return (
      <span className={`${shared.badge} ${styles.notHeld}`}>Belum dinilai</span>
    );
  }
  return <>Diinput {row.scoredOn}</>;
}

/**
 * The table "Nilai anak asuh": each member with NIM, "Kehadiran
 * pengasuhan", the score and "Keterangan". On a phone each member is a
 * block of its own. What the score and the remark of a row show is given
 * by the list that only reads and by the form.
 */
export function ScoreTable({
  rows,
  scoreOf,
  remarkOf,
}: {
  rows: readonly ScoreRow[];
  scoreOf: (row: ScoreRow) => ReactNode;
  remarkOf: (row: ScoreRow) => ReactNode;
}) {
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Anak asuh</th>
            <th>Kehadiran pengasuhan</th>
            <th>Nilai pengasuhan</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td data-title="Anak asuh">
                <StudentLink name={row.name} address={row.detailAddress} />
                <small className={shared.detail}>{row.nim}</small>
              </td>
              <td data-title="Kehadiran pengasuhan">{row.attendance}</td>
              <td data-title="Nilai pengasuhan">{scoreOf(row)}</td>
              <td data-title="Keterangan">{remarkOf(row)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
