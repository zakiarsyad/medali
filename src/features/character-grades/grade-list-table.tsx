import shared from "@/ui/data-screen.module.css";
import type { CharacterGrade } from "./character-grade";
import styles from "./character-grades.module.css";
import type { AttendancePart, GradeRow } from "./grade-list";
import {
  passWords,
  shownFinal,
  shownOneDecimal,
  shownPart,
} from "./grade-words";

export const NO_GRADE_MATCHES = "Tidak ada data pada filter ini.";

function Attendance({ part }: { part: AttendancePart }) {
  if (part.percent === null) return "-";
  return (
    <>
      {shownOneDecimal(part.percent)}
      <small className={shared.detail}>
        {part.attended}/{part.counted}
      </small>
    </>
  );
}

function Letter({ grade }: { grade: CharacterGrade }) {
  if (!grade.complete) {
    return "-";
  }
  const look = grade.passes ? styles.passes : styles.fails;
  return (
    <span className={`${shared.badge} ${look}`}>
      {grade.letter}
      <span className={shared.hidden}> ({passWords(grade.passes)})</span>
    </span>
  );
}

/**
 * "Daftar nilai karakter": each student with the four parts, Nilai akhir,
 * Huruf and Keterangan. Kehadiran and SKPM have one decimal, as on the
 * screens they come from. A missing part shows "-", and the grade "Belum
 * lengkap". On a phone each student is a block of its own.
 */
export function GradeListTable({ rows }: { rows: readonly GradeRow[] }) {
  if (rows.length === 0) {
    return <p className={shared.empty}>{NO_GRADE_MATCHES}</p>;
  }
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Kehadiran</th>
            <th>Pengasuhan</th>
            <th>SIKU</th>
            <th>SKPM</th>
            <th>Nilai akhir</th>
            <th>Huruf</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.student.id}>
              <td className={shared.rowHeading} data-title="Mahasiswa">
                <b className={shared.typed}>{row.student.name}</b>
                <small className={shared.detail}>
                  {row.student.nim} · {row.student.program}
                </small>
              </td>
              <td data-title="Kehadiran">
                <Attendance part={row.attendance} />
              </td>
              <td data-title="Pengasuhan">{shownPart(row.mentoring)}</td>
              <td data-title="SIKU">{shownPart(row.siku.score)}</td>
              <td data-title="SKPM">{shownOneDecimal(row.skpm)}</td>
              <td className={styles.final} data-title="Nilai akhir">
                {shownFinal(row.grade)}
              </td>
              <td data-title="Huruf">
                <Letter grade={row.grade} />
              </td>
              <td data-title="Keterangan">
                <span className={styles.muted}>{row.siku.note}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
