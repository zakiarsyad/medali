import shared from "@/ui/data-screen.module.css";
import styles from "./violations.module.css";
import type { RejectedClarification } from "./warning-process";

/** The clarifications of a resident's absences that were rejected and still count. */
export function RejectedTable({ rows }: { rows: RejectedClarification[] }) {
  if (rows.length === 0) return null;
  return (
    <>
      <p className={`${shared.label} ${styles.spaced}`}>
        {rows.length} klarifikasi kehadiran kegiatan asrama ditolak
      </p>
      <div className={shared.tableWrap}>
        <table className={`${shared.table} ${shared.stacked}`}>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Kegiatan</th>
              <th>Alasan klarifikasi</th>
              <th>Ditolak oleh</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td data-title="Tanggal">{row.day}</td>
                <td data-title="Kegiatan">{row.activity}</td>
                <td data-title="Alasan klarifikasi">
                  {row.reason}
                  <p className={styles.sub}>{row.explanation}</p>
                </td>
                <td data-title="Ditolak oleh">
                  {row.rejectedBy}: {row.note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
