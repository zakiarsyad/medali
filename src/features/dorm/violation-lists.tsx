import { DORM_SHORT_NAMES } from "@/dorms/dorms";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import type { AnnouncedViolation } from "./violation-announcement";
import { appealEndOf, violationStatus } from "./violation-status";
import { punishmentText, STATUS_WORDS, shownHour } from "./violation-words";
import styles from "./violations.module.css";

/** Who looks at a list: staff see the NIM and the dorm, a resident sees a name only. */
export type ListReader = "staff" | "resident";

/** Masa advokasi with the hour it ends, or Naik ke Pengelola, at `now`. */
export function StatusBadge({
  announcedAt,
  now,
}: {
  announcedAt: Date;
  now: Date;
}) {
  const status = violationStatus(announcedAt, now);
  const look = status === "appeal" ? styles.warn : styles.bad;
  return (
    <>
      <span className={`${shared.badge} ${look}`}>{STATUS_WORDS[status]}</span>
      {status === "appeal" && (
        <small className={shared.detail}>
          advokasi s.d. {shownHour(appealEndOf(announcedAt))}
        </small>
      )}
    </>
  );
}

function StudentCell({
  row,
  reader,
}: {
  row: AnnouncedViolation;
  reader: ListReader;
}) {
  return (
    <td data-title="Mahasiswa">
      <b className={shared.typed}>{row.name}</b>
      {reader === "staff" && (
        <small className={shared.detail}>
          {row.nim} · {DORM_SHORT_NAMES[row.dorm]}
        </small>
      )}
    </td>
  );
}

/**
 * Announced violations as a list: Tanggal, the student unless the list
 * is of one student, Alasan pelanggaran, Hukuman, Diumumkan and Status.
 */
export function AnnouncedTable({
  rows,
  now,
  reader,
  withStudent,
}: {
  rows: AnnouncedViolation[];
  now: Date;
  reader: ListReader;
  withStudent: boolean;
}) {
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Tanggal</th>
            {withStudent && <th>Mahasiswa</th>}
            <th>Alasan pelanggaran</th>
            <th>Hukuman</th>
            <th>Diumumkan</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td data-title="Tanggal">{shownDay(row.day)}</td>
              {withStudent && <StudentCell row={row} reader={reader} />}
              <td data-title="Alasan pelanggaran">
                <span className={shared.typed}>{row.reason}</span>
              </td>
              <td data-title="Hukuman">
                <span className={shared.typed}>
                  {punishmentText(row.punishment, row.otherPunishment)}
                </span>
              </td>
              <td data-title="Diumumkan">{shownHour(row.announcedAt)}</td>
              <td data-title="Status">
                <StatusBadge announcedAt={row.announcedAt} now={now} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
