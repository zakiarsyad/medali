import type { SQL } from "drizzle-orm";
import { campusTime } from "@/academic-periods/campus-clock";
import { campusDay } from "@/academic-periods/campus-day";
import { database } from "@/db/database";
import { PageHead } from "@/ui/page-head";
import type { SearchParams } from "@/ui/search-params";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import styles from "./activities.module.css";
import { readActivitiesParams } from "./activities-address";
import { loadActivitiesView } from "./activities-view";
import { ActivityBoard } from "./activity-board";

/**
 * Kegiatan asrama for staff: Jadwal harian, Kegiatan rutin and Kegiatan
 * non rutin. `visible` is the students the account may see: the Peserta
 * are counted among them.
 */
export async function ActivitiesScreen({
  tabs,
  searchParams,
  visible,
  mayManage,
}: {
  tabs: TabLinksProps;
  searchParams: SearchParams;
  visible: SQL;
  /** Whether the account may change the activities, or only see them. */
  mayManage: boolean;
}) {
  // The server's clock in campus time, so every browser sees one state.
  const moment = new Date();
  const now = { day: campusDay(moment), time: campusTime(moment) };
  const params = readActivitiesParams(searchParams, now.day);
  const view = await loadActivitiesView(database(), params, visible);
  return (
    <>
      <PageHead title="Kegiatan asrama">
        Jadwal kegiatan rutin dan non rutin para penghuni asrama.
      </PageHead>
      <TabLinks {...tabs} />
      {!mayManage && (
        <p className={styles.note}>
          Menu asrama dikelola oleh Pengelola Asrama. Anda dapat melihat rekap
          dan rinciannya.
        </p>
      )}
      <ActivityBoard params={params} view={view} now={now} />
    </>
  );
}
