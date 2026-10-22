import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import { AnnouncementPanel } from "./announcement-panel";
import { ReductionsPanel } from "./reductions-panel";
import type { StaffViolations } from "./staff-violations";
import {
  type StaffViolationParams,
  staffViolationsAddress,
} from "./violation-address";
import { APPEAL_HOURS, VIOLATIONS_PAGE_SIZE } from "./violation-ids";
import { RekapPanel, StudentViolationsDialog } from "./violation-rekap";
import type { ViolationSchedule } from "./violation-schedule";
import { ViolationScheduleTable } from "./violation-schedule-table";
import styles from "./violations.module.css";
import type { WarningCalls } from "./warning-calls";
import { WarningCallsPanel } from "./warning-calls-panel";

export const READ_ONLY_NOTE =
  "Pelanggaran dicatat oleh Badan Asrama Mahasiswa. Anda dapat melihat rekap dan rinciannya.";

function SchedulePanel({
  schedule,
  params,
  ownStudentId,
}: {
  schedule: ViolationSchedule;
  params: StaffViolationParams;
  ownStudentId: string | null;
}) {
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Jadwal publikasi</h2>
      <p className={styles.sub}>
        Pelanggaran yang sudah diinput dan menunggu jam pengumuman
      </p>
      {/* Made anew for each page, so an answer shown on one is not kept on another. */}
      <ViolationScheduleTable
        key={schedule.page}
        rows={schedule.rows}
        ownStudentId={ownStudentId}
      />
      {schedule.matching > 0 && (
        <ListPager
          page={schedule.page}
          matching={schedule.matching}
          pageSize={VIOLATIONS_PAGE_SIZE}
          noun="pelanggaran"
          keepsPlace
          stepsOnOnePage={false}
          addressOf={(page) =>
            staffViolationsAddress({ ...params, schedulePage: page })
          }
        />
      )}
    </section>
  );
}

/**
 * What "Dalam masa advokasi" says under its number: to those who decide,
 * how many appeals wait for them; to everyone else, how long the appeal
 * time lasts.
 */
function inAppealNote(waitingAppeals: number | null): string {
  if (waitingAppeals === null)
    return `batas ${APPEAL_HOURS} jam setelah diumumkan`;
  return `${waitingAppeals} advokasi menunggu keputusan`;
}

function Numbers({
  board,
  waitingAppeals,
  warnings,
}: {
  board: StaffViolations;
  waitingAppeals: number | null;
  warnings: WarningCalls;
}) {
  const { numbers, semester } = board;
  return (
    <NumberCards>
      <NumberCard
        label="Diumumkan hari ini"
        amount={numbers.announcedToday}
        note="pelanggaran"
      />
      <NumberCard
        label="Dalam masa advokasi"
        amount={numbers.inAppeal}
        note={inAppealNote(waitingAppeals)}
      />
      <NumberCard
        label="Naik ke Pengelola Asrama"
        amount={numbers.escalated}
        note={
          semester === null
            ? "belum ada periode akademik"
            : `semester ${semester.title}`
        }
      />
      <NumberCard
        label="Panggilan klarifikasi aktif"
        amount={warnings.active}
        note={`${warnings.withLetter} mahasiswa sudah menerima SP`}
      />
    </NumberCards>
  );
}

/** The parts of the address a new day of the announcement keeps. */
function keptBesideDay(params: StaffViolationParams): [string, string][] {
  const address = staffViolationsAddress({
    ...params,
    day: null,
    announcementPage: 1,
    studentId: null,
    studentPage: 1,
  });
  return [...new URL(address, "http://medali").searchParams.entries()];
}

/**
 * Pelanggaran for staff: the three numbers, "Input dan publikasi
 * pelanggaran" and "Jadwal publikasi" for those who record and a note for
 * those who only read, "Advokasi masuk" for those who decide,
 * "Pengajuan hukuman disiplin dari Pengelola Asrama" for those who read
 * it, "Panggilan klarifikasi dan surat peringatan", "Rekap pelanggaran per
 * mahasiswa" with the box of one student, "Riwayat pengurangan
 * pelanggaran" for those who read it, and "Pengumuman pelanggaran".
 */
export function StaffViolationsScreen({
  tabs,
  params,
  board,
  now,
  form,
  schedule,
  appeals,
  waitingAppeals,
  proposals,
  warnings,
  processes,
  ownStudentId,
  reduces,
  callProcess,
  ownRecord,
}: {
  tabs: TabLinksProps;
  params: StaffViolationParams;
  board: StaffViolations;
  now: Date;
  /** "Input dan publikasi pelanggaran", or null for an account that only reads. */
  form: ReactNode;
  /** "Jadwal publikasi", or null for an account that only reads. */
  schedule: ViolationSchedule | null;
  /** "Advokasi masuk", or null for an account that does not decide appeals. */
  appeals: ReactNode;
  /** How many appeals wait, for an account that decides them, or else null. */
  waitingAppeals: number | null;
  /** "Pengajuan hukuman disiplin dari Pengelola Asrama", or null for an account that does not read it. */
  proposals: ReactNode;
  /** "Panggilan klarifikasi dan surat peringatan" of the running semester. */
  warnings: WarningCalls;
  /** Whether the account schedules calls and issues SPs: Pengelola Asrama. */
  processes: boolean;
  /** The student the account belongs to, whose rows have no "Proses" or "Batalkan", or null. */
  ownStudentId: string | null;
  /** Whether the account reduces violations: Pengelola Asrama. */
  reduces: boolean;
  /** "Proses" of one resident in a box, or null for none. */
  callProcess: ReactNode;
  /** The account's own record, for a resident who is also staff, or null. */
  ownRecord: ReactNode;
}) {
  return (
    <>
      <PageHead title="Pelanggaran">
        Pelanggaran tata tertib asrama yang diumumkan Badan Asrama Mahasiswa
        pada jam yang ditentukan. Setelah diumumkan ada masa advokasi{" "}
        {APPEAL_HOURS} jam; setelah itu pelanggaran naik ke Pengelola Asrama.
      </PageHead>
      <TabLinks {...tabs} />
      <Numbers
        board={board}
        waitingAppeals={waitingAppeals}
        warnings={warnings}
      />
      {form === null ? (
        <p className={styles.note}>{READ_ONLY_NOTE}</p>
      ) : (
        <section className={shared.panel}>{form}</section>
      )}
      {schedule !== null && (
        <SchedulePanel
          schedule={schedule}
          params={params}
          ownStudentId={ownStudentId}
        />
      )}
      {appeals}
      {proposals}
      <WarningCallsPanel
        calls={warnings}
        params={params}
        processes={processes}
        ownStudentId={ownStudentId}
      />
      <RekapPanel
        rekap={board.rekap}
        marks={board.marks}
        params={params}
        semesters={board.semesters}
        shownSemester={board.semester?.id ?? null}
      />
      {board.reductions !== null && (
        <ReductionsPanel
          reductions={board.reductions}
          params={params}
          undoes={reduces}
          ownStudentId={ownStudentId}
        />
      )}
      <AnnouncementPanel
        announcement={board.announcement}
        now={now}
        reader="staff"
        lede="Seluruh pelanggaran mahasiswa yang sudah diumumkan, per hari"
        keep={keptBesideDay(params)}
        addressOfPage={(page) =>
          staffViolationsAddress({
            ...params,
            day: board.announcement.day,
            announcementPage: page,
            studentId: null,
          })
        }
      />
      {ownRecord}
      {callProcess}
      {board.student !== null && board.semester !== null && (
        <StudentViolationsDialog
          student={board.student}
          letters={board.letters}
          params={params}
          semesterTitle={board.semester.title}
          now={now}
          reduces={reduces && board.student.studentId !== ownStudentId}
        />
      )}
    </>
  );
}
