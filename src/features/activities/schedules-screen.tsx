import { campusTime } from "@/academic-periods/campus-clock";
import { campusDay } from "@/academic-periods/campus-day";
import { database } from "@/db/database";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import { readCohortCounts } from "./cohort-counts";
import { listSchedules } from "./list-schedules";
import type { ScheduleListParams } from "./schedule-list-address";
import { ScheduleListPanel } from "./schedule-list-panel";

/** The tab "Kegiatan PPKS": the schedules of the PPKS activities. */
export async function SchedulesScreen({
  tabs,
  params,
}: {
  tabs: TabLinksProps;
  params: ScheduleListParams;
}) {
  const db = database();
  // The server's clock in campus time, so every browser sees one status.
  const moment = new Date();
  const now = { day: campusDay(moment), time: campusTime(moment) };
  const [list, counts] = await Promise.all([
    listSchedules(db, params.level, params.page),
    readCohortCounts(db),
  ]);
  return (
    <>
      <PageHead title="Kegiatan karakter">
        Jadwal pelaksanaan program pembangunan karakter per semester. Program
        dan indikatornya diatur di menu Kurikulum. Kehadiran dihitung dari foto
        kehadiran yang diunggah mahasiswa dan divalidasi Pegawai UPK.
      </PageHead>
      <TabLinks {...tabs} />
      <ScheduleListPanel
        list={list}
        level={params.level}
        counts={counts}
        now={now}
      />
    </>
  );
}
