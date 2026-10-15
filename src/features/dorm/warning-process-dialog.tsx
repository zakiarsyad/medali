import { campusDay } from "@/academic-periods/campus-day";
import shared from "@/ui/data-screen.module.css";
import { ModalDialog } from "@/ui/modal-dialog";
import { CallScheduleForm } from "./call-schedule-form";
import { IssueLetterForm } from "./issue-letter-form";
import { RejectedTable } from "./rejected-table";
import {
  type StaffViolationParams,
  staffViolationsAddress,
} from "./violation-address";
import { AnnouncedTable } from "./violation-lists";
import styles from "./violations.module.css";
import { LetterMark } from "./warning-calls-panel";
import { DEFAULT_CALL_PLACE, DEFAULT_CALL_TIME } from "./warning-ids";
import { firstOfferedDay, lastCallDay } from "./warning-input";
import type { WarningProcess } from "./warning-process";
import { causeWords } from "./warning-words";

export const NO_COUNTED = "Tidak ada pelanggaran tercatat semester ini.";

/**
 * "Proses" of one resident called for an SP, for Pengelola Asrama, in a
 * box over the tab: why they are called, "1. Jadwalkan klarifikasi", "2.
 * Catat klarifikasi dan terbitkan SP", the rejected clarifications and
 * the counted violations. Once the SP is issued the resident is no
 * longer called, so the box does not open again. On a phone its
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
        <section className={styles.field}>
          <h3 className={shared.heading}>
            2. Catat klarifikasi dan terbitkan SP {call.level}
          </h3>
          <IssueLetterForm
            key={call.level}
            studentId={call.studentId}
            name={call.name}
            level={call.level}
          />
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
