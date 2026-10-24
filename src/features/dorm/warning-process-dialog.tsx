import { campusDay } from "@/academic-periods/campus-day";
import shared from "@/ui/data-screen.module.css";
import { ModalDialog } from "@/ui/modal-dialog";
import { toneBadge } from "@/ui/tone-badge";
import { CallScheduleForm } from "./call-schedule-form";
import { IssueLetterForm } from "./issue-letter-form";
import { NO_COUNTED, ReduceManyForm } from "./reduce-many-form";
import { RejectedTable } from "./rejected-table";
import {
  type StaffViolationParams,
  staffViolationsAddress,
} from "./violation-address";
import { AnnouncedTable } from "./violation-lists";
import styles from "./violations.module.css";
import type { WarningCall } from "./warning-calls";
import { LetterMark } from "./warning-calls-panel";
import {
  DEFAULT_CALL_PLACE,
  DEFAULT_CALL_TIME,
  type WarningLevel,
} from "./warning-ids";
import { firstOfferedDay, lastCallDay } from "./warning-input";
import type { WarningProcess } from "./warning-process";
import { causeWords } from "./warning-words";

export const NOT_CALLED_NOW =
  "Mahasiswa ini tidak sedang dalam panggilan klarifikasi.";

/**
 * What the box says in place of its two parts once the resident is no
 * longer called: the highest SP issued to them this semester, which is
 * true both just after "Terbitkan SP" and after a reduction ended a call
 * for the next SP, or else that they are not called.
 */
function endedCallWords(mark: WarningLevel | null): string {
  if (mark === null) return NOT_CALLED_NOW;
  return `SP ${mark} sudah terbit semester ini.`;
}

/**
 * Why the resident is called, "1. Jadwalkan klarifikasi" and "2. Catat
 * klarifikasi dan terbitkan SP", side by side, in one column on a phone.
 */
function CallParts({ call, now }: { call: WarningCall; now: Date }) {
  const offered = call.schedule ?? {
    day: firstOfferedDay(now),
    time: DEFAULT_CALL_TIME,
    place: DEFAULT_CALL_PLACE,
  };
  return (
    <>
      <p className={styles.spaced}>
        <span className={toneBadge("warning")}>Penetapan SP {call.level}</span>{" "}
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
    </>
  );
}

/** The counted violations, read only. */
function CountedTable({
  process,
  now,
}: {
  process: WarningProcess;
  now: Date;
}) {
  if (process.counted.length === 0) {
    return <p className={shared.empty}>{NO_COUNTED}</p>;
  }
  return (
    <AnnouncedTable
      rows={process.counted}
      now={now}
      reader="staff"
      withStudent={false}
    />
  );
}

/**
 * "Proses" of one resident called for an SP, for Pengelola Asrama, in a
 * box over the tab: why they are called, "1. Jadwalkan klarifikasi", "2.
 * Catat klarifikasi dan terbitkan SP", the rejected clarifications and
 * the counted violations, each with a tick "Kurangi" for an account that
 * `reduces`. Once the resident is no longer called, after an SP is issued
 * or violations are reduced, the box says which SP they have, or that
 * they are not called, in place of the two parts, and the answer of the
 * ticks stays, as they keep their place in the box.
 * On a phone its parts stand in one column.
 */
export function WarningProcessDialog({
  process,
  params,
  now,
  reduces,
}: {
  process: WarningProcess;
  params: StaffViolationParams;
  now: Date;
  reduces: boolean;
}) {
  const { call, student } = process;
  const room = call === null ? "" : ` · ${call.room}`;
  return (
    <ModalDialog
      label="Proses panggilan klarifikasi"
      closeAddress={staffViolationsAddress({ ...params, callStudentId: null })}
    >
      <h2 className={shared.heading}>{student.name}</h2>
      <p className={styles.sub}>
        {student.nim}
        {room} · semester {process.semesterTitle}
      </p>
      {call === null ? (
        <p className={styles.spaced}>{endedCallWords(process.mark)}</p>
      ) : (
        <CallParts call={call} now={now} />
      )}
      <RejectedTable rows={process.rejected} />
      <p className={`${shared.label} ${styles.spaced}`}>
        {process.counted.length} pelanggaran tercatat semester ini
      </p>
      {reduces ? (
        <ReduceManyForm
          key={student.studentId}
          studentId={student.studentId}
          name={student.name}
          rows={process.counted}
          now={now}
        />
      ) : (
        <CountedTable process={process} now={now} />
      )}
    </ModalDialog>
  );
}
