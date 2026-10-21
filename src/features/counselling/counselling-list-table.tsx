import shared from "@/ui/data-screen.module.css";
import { ConsentBadge } from "./consent-badge";
import type { CounsellingStudentRow } from "./counselling-list-view";
import {
  NOTHING,
  scheduleWords,
  sessionsWords,
} from "./counselling-list-words";
import { SharingBadge } from "./sharing-badge";

function CounsellingListRow({ row }: { row: CounsellingStudentRow }) {
  return (
    <tr>
      <td className={shared.rowHeading} data-title="Mahasiswa">
        <b className={shared.typed}>{row.name}</b>
        <small className={shared.detail}>
          {row.nim} · {row.program}
        </small>
      </td>
      <td data-title="Persetujuan">
        <ConsentBadge status={row.consent} />
      </td>
      <td data-title="Konseling">{sessionsWords(row.sessions, row.nextDay)}</td>
      <td data-title="Jadwal">{scheduleWords(row.schedule)}</td>
      <td data-title="Publikasi">
        {row.sharing === null ? NOTHING : <SharingBadge status={row.sharing} />}
      </td>
    </tr>
  );
}

/** The rows of "Daftar mahasiswa" on Konseling; on a phone each student is a card. */
export function CounsellingListTable({
  rows,
}: {
  rows: CounsellingStudentRow[];
}) {
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Persetujuan</th>
            <th>Konseling</th>
            <th>Jadwal</th>
            <th>Publikasi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <CounsellingListRow key={row.studentId} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
