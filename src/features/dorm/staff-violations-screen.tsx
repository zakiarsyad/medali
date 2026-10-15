import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import {
  type StaffViolationParams,
  staffViolationsAddress,
} from "./violation-address";
import { APPEAL_HOURS, VIOLATIONS_PAGE_SIZE } from "./violation-ids";
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

/**
 * Pelanggaran for staff: "Input dan publikasi pelanggaran" and "Jadwal
 * publikasi" for those who record, and a note for those who only read.
 */
export function StaffViolationsScreen({
  tabs,
  params,
  form,
  schedule,
}: {
  tabs: TabLinksProps;
  params: StaffViolationParams;
  /** "Input dan publikasi pelanggaran", or null for an account that only reads. */
  form: ReactNode;
  /** "Jadwal publikasi", or null for an account that only reads. */
  schedule: ViolationSchedule | null;
}) {
  return (
    <>
      <PageHead title="Pelanggaran">
        Pelanggaran tata tertib asrama yang diumumkan Badan Asrama Mahasiswa
        pada jam yang ditentukan. Setelah diumumkan ada masa advokasi{" "}
        {APPEAL_HOURS} jam; setelah itu pelanggaran naik ke Pengelola Asrama.
      </PageHead>
      <TabLinks {...tabs} />
      {form === null ? (
        <p className={styles.note}>{READ_ONLY_NOTE}</p>
      ) : (
        <section className={shared.panel}>{form}</section>
      )}
      {schedule !== null && (
        <SchedulePanel schedule={schedule} params={params} />
      )}
    </>
  );
}
