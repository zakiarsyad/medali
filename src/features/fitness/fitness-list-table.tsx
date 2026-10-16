import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { CategoryBadge } from "./category-badge";
import styles from "./fitness.module.css";
import type { FitnessListRow } from "./fitness-board";
import { shownCategoryOf } from "./fitness-category";
import type { FitnessLimits } from "./fitness-ids";

export const NO_FITNESS_MATCHES = "Tidak ada data pada filter ini.";

function StudentRow({
  row,
  limits,
}: {
  row: FitnessListRow;
  limits: FitnessLimits;
}) {
  const { latest } = row;
  return (
    <tr>
      <td className={shared.rowHeading} data-title="Mahasiswa">
        <b className={shared.typed}>{row.name}</b>
        <small className={shared.detail}>
          {row.nim} · {row.program}
        </small>
      </td>
      <td data-title="Tes">{latest ? shownDay(latest.testedOn) : "-"}</td>
      <td className={styles.score} data-title="Skor">
        {latest ? latest.score : "-"}
      </td>
      <td data-title="Kategori">
        <CategoryBadge
          category={shownCategoryOf(latest?.score ?? null, limits)}
        />
      </td>
    </tr>
  );
}

/**
 * "Hasil tes kebugaran": each student with the day of their latest test,
 * its score and its category with the limits in force, or Belum dites.
 * On a phone each student is a block of its own.
 */
export function FitnessListTable({
  rows,
  limits,
}: {
  rows: readonly FitnessListRow[];
  limits: FitnessLimits;
}) {
  if (rows.length === 0) {
    return <p className={shared.empty}>{NO_FITNESS_MATCHES}</p>;
  }
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Tes</th>
            <th>Skor</th>
            <th>Kategori</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <StudentRow key={row.id} row={row} limits={limits} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
