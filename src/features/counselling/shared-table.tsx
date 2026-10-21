import shared from "@/ui/data-screen.module.css";
import { DAY } from "@/ui/day";
import type { SharedRow } from "./shared-view";
import { sharedPartsLine } from "./shared-words";

/** One student of "Data yang dipublikasikan untuk Anda". */
function SharedListRow({ row }: { row: SharedRow }) {
  return (
    <tr>
      <td className={shared.rowHeading} data-title="Mahasiswa">
        <b className={shared.typed}>{row.name}</b>
        <small className={shared.detail}>
          {row.nim} · {row.program}
        </small>
      </td>
      <td data-title="Pengasuh">{row.mentorName ?? "-"}</td>
      <td data-title="Data yang dibagikan">{sharedPartsLine(row.data)}</td>
      <td data-title="Dipublikasikan">{DAY.format(row.publishedAt)}</td>
    </tr>
  );
}

/** The rows of "Data yang dipublikasikan untuk Anda"; on a phone each student is a card. */
export function SharedTable({ rows }: { rows: SharedRow[] }) {
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Pengasuh</th>
            <th>Data yang dibagikan</th>
            <th>Dipublikasikan</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <SharedListRow key={row.studentId} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
