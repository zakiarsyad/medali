import type { ReactNode } from "react";
import { shownPart } from "@/character-grades/grade-words";
import { StudentLink } from "@/mentoring/student-link";
import shared from "@/ui/data-screen.module.css";
import { toneBadge } from "@/ui/tone-badge";
import styles from "./mentoring.module.css";
import { bandOf } from "./score-bands";
import type { ScoreRow } from "./score-rows";

/** What a row says of a score given before the indicators. */
export const BEFORE_INDICATORS = "Nilai tanpa indikator";

/**
 * "Keterangan" of one row: what the rubric says of the final score, and
 * under it the state of the row, such as "Belum dinilai" or the day it
 * was saved. A row without a final score has no sentence.
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

/**
 * The state of a row that holds what is saved: the day, that its score
 * was given before the indicators, or that it has no score.
 */
export function SavedState({ row }: { row: ScoreRow }) {
  if (row.scoredOn === null) {
    return <span className={toneBadge("plain")}>Belum dinilai</span>;
  }
  if (row.indicatorScores === null) {
    return (
      <>
        <span className={toneBadge("plain")}>{BEFORE_INDICATORS}</span> Diinput{" "}
        {row.scoredOn}
      </>
    );
  }
  return <>Diinput {row.scoredOn}</>;
}

/** "Nilai akhir" of a row: the final score, with its decimal when it has one, or a dash. */
export function FinalScore({ score }: { score: number | null }) {
  return <b>{shownPart(score)}</b>;
}

/**
 * The table "Nilai anak asuh": each member with NIM, "Kehadiran
 * pengasuhan", a column for each of the six indicators named by
 * `names`, "Nilai akhir" and "Keterangan". On a phone each member is a
 * block of its own, with the six stacked. What the cells of a row show is
 * given by the list that only reads and by the form.
 */
export function ScoreTable({
  rows,
  names,
  indicatorOf,
  finalOf,
  remarkOf,
}: {
  rows: readonly ScoreRow[];
  /** The names of the indicators in force, in their order. */
  names: readonly string[];
  indicatorOf: (row: ScoreRow, place: number) => ReactNode;
  finalOf: (row: ScoreRow) => ReactNode;
  remarkOf: (row: ScoreRow) => ReactNode;
}) {
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Anak asuh</th>
            <th>Kehadiran pengasuhan</th>
            {names.map((name) => (
              <th key={name}>{name}</th>
            ))}
            <th>Nilai akhir</th>
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
              {names.map((name, place) => (
                <td
                  key={name}
                  data-title={name}
                  className={styles.indicatorCell}
                >
                  {indicatorOf(row, place)}
                </td>
              ))}
              <td data-title="Nilai akhir">{finalOf(row)}</td>
              <td data-title="Keterangan">{remarkOf(row)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
