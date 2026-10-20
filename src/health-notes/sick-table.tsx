import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { FinalCategoryBadge } from "./category-badge";
import styles from "./health-notes.module.css";
import {
  examinerOf,
  ILLNESS_WORDS,
  NOTE_MISSING,
  noteText,
  roomWords,
} from "./health-words";
import type { RecapRow } from "./sick-list";

function HistoryCell({ row }: { row: RecapRow }) {
  const { note } = row;
  if (note === null) {
    return (
      <span
        className={`${shared.badge} ${styles.category} ${styles.attention}`}
      >
        {NOTE_MISSING}
      </span>
    );
  }
  return (
    <>
      {note.illnesses.map(({ illness }) => (
        <span key={illness} className={shared.badge}>
          {ILLNESS_WORDS[illness]}
        </span>
      ))}
      <small className={shared.detail}>{noteText(note)}</small>
    </>
  );
}

function SickStudentRow({ row }: { row: RecapRow }) {
  const { note } = row;
  return (
    <tr>
      <td className={shared.rowHeading} data-title="Mahasiswa">
        <b className={shared.typed}>{row.name}</b>
        <small className={shared.detail}>
          {row.nim} · {row.program}
        </small>
      </td>
      <td data-title="Kamar">{roomWords(row.dorm, row.room)}</td>
      <td data-title="Pengasuh">{row.mentorName ?? "-"}</td>
      <td data-title="Kategori">
        <FinalCategoryBadge final={row.final} showsMark />
      </td>
      <td data-title="Riwayat penyakit dan catatan">
        <HistoryCell row={row} />
      </td>
      <td data-title="Dicatat">
        {note === null ? (
          "-"
        ) : (
          <>
            {shownDay(note.examinedOn)}
            <small className={shared.detail}>{examinerOf(note)}</small>
          </>
        )}
      </td>
    </tr>
  );
}

/**
 * The rows of a list of sick students: Mahasiswa, Kamar, Pengasuh,
 * Kategori, "Riwayat penyakit dan catatan" and Dicatat. On a phone each
 * student is a block of its own.
 */
export function SickTable({ rows }: { rows: readonly RecapRow[] }) {
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Kamar</th>
            <th>Pengasuh</th>
            <th>Kategori</th>
            <th>Riwayat penyakit dan catatan</th>
            <th>Dicatat</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <SickStudentRow key={row.id} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
