import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import { AnnouncementPanel } from "./announcement-panel";
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

export const READ_ONLY_NOTE =
  "Pelanggaran dicatat oleh Badan Asrama Mahasiswa. Anda dapat melihat rekap dan rinciannya.";

function SchedulePanel({
  schedule,
  params,
}: {
  schedule: ViolationSchedule;
  params: StaffViolationParams;
}) {
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Jadwal publikasi</h2>
      <p className={styles.sub}>
        Pelanggaran yang sudah diinput dan menunggu jam pengumuman
      </p>
      {/* Made anew for each page, so an answer shown on one is not kept on another. */}
      <ViolationScheduleTable key={schedule.page} rows={schedule.rows} />
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

function Numbers({ board }: { board: StaffViolations }) {
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
        note={`batas ${APPEAL_HOURS} jam setelah diumumkan`}
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
 * those who only read, "Advokasi masuk" for those who decide, "Rekap pelanggaran per mahasiswa" with the box of
 * one student, and "Pengumuman pelanggaran".
 */
export function StaffViolationsScreen({
  tabs,
  params,
  board,
  now,
  form,
  schedule,
  appeals,
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
}) {
  return (
    <>
      <PageHead title="Pelanggaran">
        Pelanggaran tata tertib asrama yang diumumkan Badan Asrama Mahasiswa
        pada jam yang ditentukan. Setelah diumumkan ada masa advokasi{" "}
        {APPEAL_HOURS} jam; setelah itu pelanggaran naik ke Pengelola Asrama.
      </PageHead>
      <TabLinks {...tabs} />
      <Numbers board={board} />
      {form === null ? (
        <p className={styles.note}>{READ_ONLY_NOTE}</p>
      ) : (
        <section className={shared.panel}>{form}</section>
      )}
      {schedule !== null && (
        <SchedulePanel schedule={schedule} params={params} />
      )}
      {appeals}
      <RekapPanel
        rekap={board.rekap}
        params={params}
        semesters={board.semesters}
        shownSemester={board.semester?.id ?? null}
      />
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
      {board.student !== null && board.semester !== null && (
        <StudentViolationsDialog
          student={board.student}
          params={params}
          semesterTitle={board.semester.title}
          now={now}
        />
      )}
    </>
  );
}
