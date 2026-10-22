import { GradeLetterBadge } from "@/character-grades/grade-letter-badge";
import type { AttendancePart, GradeRow } from "@/character-grades/grade-list";
import {
  LIMITED_WORDS,
  shownFinal,
  shownOneDecimal,
  shownPart,
} from "@/character-grades/grade-words";
import shared from "@/ui/data-screen.module.css";
import { ProfileNameLink } from "@/ui/profile-name-link";
import styles from "./character-grades.module.css";
import { type GradeParams, gradeAddress } from "./grade-address";

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

/**
 * "Daftar nilai karakter": each student with the four parts, Nilai akhir,
 * Huruf and Keterangan, which marks a grade held at 70 by a penalty. Kehadiran and SKPM have one decimal, as on the
 * screens they come from. A missing part shows "-", and the grade "Belum
 * lengkap". On a phone each student is a block of its own.
 */
export function GradeListTable({
  rows,
  params,
  nameOnly = [],
}: {
  rows: readonly GradeRow[];
  /** The tab's choices, kept when a name opens the student's profile. */
  params: GradeParams;
  /** The students whose name opens nothing, as one who has left since a closing. */
  nameOnly?: readonly string[];
}) {
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
                {nameOnly.includes(row.student.id) ? (
                  <b className={shared.typed}>{row.student.name}</b>
                ) : (
                  <ProfileNameLink
                    name={row.student.name}
                    href={gradeAddress({
                      ...params,
                      profileId: row.student.id,
                    })}
                  />
                )}
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
                <GradeLetterBadge grade={row.grade} />
              </td>
              <td data-title="Keterangan">
                {row.limited && (
                  <span className={`${shared.badge} ${styles.limited}`}>
                    {LIMITED_WORDS}
                  </span>
                )}
                <span className={styles.muted}>{row.siku.note}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
