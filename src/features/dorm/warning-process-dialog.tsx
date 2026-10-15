import { campusDay } from "@/academic-periods/campus-day";
import shared from "@/ui/data-screen.module.css";
import { ModalDialog } from "@/ui/modal-dialog";
import { CallScheduleForm } from "./call-schedule-form";
import {
  type StaffViolationParams,
  staffViolationsAddress,
} from "./violation-address";
import { AnnouncedTable } from "./violation-lists";
import styles from "./violations.module.css";
import { LetterMark } from "./warning-calls-panel";
import { DEFAULT_CALL_PLACE, DEFAULT_CALL_TIME } from "./warning-ids";
import { firstOfferedDay, lastCallDay } from "./warning-input";
import type { RejectedClarification, WarningProcess } from "./warning-process";
import { causeWords } from "./warning-words";

export const NO_COUNTED = "Tidak ada pelanggaran tercatat semester ini.";

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

/**
 * "Proses" of one resident called for an SP, for Pengelola Asrama, in a
 * box over the tab: why they are called, "1. Jadwalkan klarifikasi", the
 * rejected clarifications and the counted violations. On a phone its
 * parts stand in one column.
 */
export function WarningProcessDialog({
  process,
  params,
  now,
}: {
  process: WarningProcess;
  params: StaffViolationParams;
  now: Date;
}) {
  const { call } = process;
  const offered = call.schedule ?? {
    day: firstOfferedDay(now),
    time: DEFAULT_CALL_TIME,
    place: DEFAULT_CALL_PLACE,
  };
  return (
    <ModalDialog
      label="Proses panggilan klarifikasi"
      closeAddress={staffViolationsAddress({ ...params, callStudentId: null })}
    >
      <h2 className={shared.heading}>{call.name}</h2>
      <p className={styles.sub}>
        {call.nim} · {call.room} · semester {process.semesterTitle}
      </p>
      <p className={styles.spaced}>
        <span className={`${shared.badge} ${styles.warn}`}>
          Penetapan SP {call.level}
        </span>{" "}
        <LetterMark level={call.mark} /> {causeWords(call.causes)}
      </p>
      <div className={shared.form}>
        <section className={styles.field}>
          <h3 className={shared.heading}>1. Jadwalkan klarifikasi</h3>
          {/* Made anew for each SP, so a schedule of SP 1 is not offered for SP 2. */}
          <CallScheduleForm
            key={call.level}
            studentId={call.studentId}
            level={call.level}
            shown={offered}
            isSent={call.schedule !== null}
            firstDay={campusDay(now)}
            lastDay={lastCallDay(now)}
          />
          <p className={styles.sub}>
            Jadwal tampil di menu Asrama &gt; Pelanggaran milik mahasiswa.
          </p>
        </section>
      </div>
      <RejectedTable rows={process.rejected} />
      <p className={`${shared.label} ${styles.spaced}`}>
        {call.counted} pelanggaran tercatat semester ini
      </p>
      {process.counted.length === 0 ? (
        <p className={shared.empty}>{NO_COUNTED}</p>
      ) : (
        <AnnouncedTable
          rows={process.counted}
          now={now}
          reader="staff"
          withStudent={false}
        />
      )}
    </ModalDialog>
  );
}
