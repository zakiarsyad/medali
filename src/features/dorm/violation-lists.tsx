import { DORM_SHORT_NAMES } from "@/dorms/dorms";
import type { BadgeTone } from "@/ui/badge-tone";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { toneBadge } from "@/ui/tone-badge";
import type { AnnouncedViolation } from "./violation-announcement";
import {
  appealEndOf,
  recordStatus,
  type ViolationStatus,
} from "./violation-status";
import { punishmentText, STATUS_WORDS, shownHour } from "./violation-words";

/** Who looks at a list: staff see the NIM and the dorm, a resident sees a name only. */
export type ListReader = "staff" | "resident";

const STATUS_TONES: Record<ViolationStatus, BadgeTone | null> = {
  scheduled: null,
  appeal: "warning",
  appeal_waiting: "warning",
  appeal_accepted: "good",
  escalated: "bad",
  reduced: "good",
};

/** What the status of a violation is drawn from. */
export type StatusOf = Pick<
  AnnouncedViolation,
  "announcedAt" | "appeal" | "reduced" | "reductionReason"
>;

/**
 * Where an announced violation stands at `now`: Masa advokasi with the
 * hour it ends, Advokasi diproses, Advokasi diterima, Naik ke Pengelola,
 * with "advokasi ditolak" when its appeal was rejected, or Dikurangi
 * with Dasar pengurangan. Only the result of an appeal, never its
 * reason.
 */
export function StatusBadge({ row, now }: { row: StatusOf; now: Date }) {
  const { announcedAt, appeal } = row;
  const status = recordStatus(announcedAt, appeal, row.reduced, now);
  return (
    <>
      <span className={toneBadge(STATUS_TONES[status])}>
        {STATUS_WORDS[status]}
      </span>
      {status === "appeal" && (
        <small className={shared.detail}>
          advokasi s.d. {shownHour(appealEndOf(announcedAt))}
        </small>
      )}
      {appeal === "rejected" && (
        <small className={shared.detail}>advokasi ditolak</small>
      )}
      {status === "reduced" && (
        <small className={`${shared.detail} ${shared.typed}`}>
          {row.reductionReason}
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

/** The titles of the columns of a list of one student's violations. */
export const ONE_STUDENT_TITLES = [
  "Tanggal",
  "Alasan pelanggaran",
  "Hukuman",
  "Diumumkan",
  "Status",
];

/**
 * The cells of one violation: Tanggal, the student unless the list is of
 * one student, Alasan pelanggaran, Hukuman, Diumumkan and Status.
 */
export function ViolationCells({
  row,
  now,
  reader,
  withStudent,
}: {
  row: AnnouncedViolation;
  now: Date;
  reader: ListReader;
  withStudent: boolean;
}) {
  return (
    <>
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
        <StatusBadge row={row} now={now} />
      </td>
    </>
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
              <ViolationCells
                row={row}
                now={now}
                reader={reader}
                withStudent={withStudent}
              />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
