import { randomUUID } from "node:crypto";
import type { SQL } from "drizzle-orm";
import type { ReactNode } from "react";
import { campusTime } from "@/academic-periods/campus-clock";
import { campusDay } from "@/academic-periods/campus-day";
import { database } from "@/db/database";
import type { SearchParams } from "@/ui/search-params";
import type { TabLinksProps } from "@/ui/tab-links";
import { TabbedHead } from "@/ui/tabbed-head";
import { readActivitiesParams } from "./activities-address";
import { loadActivitiesView } from "./activities-view";
import { ActivityBoard } from "./activity-board";
import { ManagedNote } from "./managed-note";

/**
 * Kegiatan asrama for staff: Jadwal harian, Kegiatan rutin and Kegiatan
 * non rutin. `visible` is the students the account may see: the Peserta
 * are counted among them. `ownPart` is the resident part of an account
 * that also lives in the dorm, shown above the schedule.
 */
export async function ActivitiesScreen({
  tabs,
  searchParams,
  visible,
  mayManage,
  mayCount,
  attendanceVisible,
  ownPart,
  ownStudentId,
}: {
  tabs: TabLinksProps;
  searchParams: SearchParams;
  visible: SQL;
  /** Whether the account may change the activities, or only see them. */
  mayManage: boolean;
  /** Whether the account may count and announce the attendance. */
  mayCount: boolean;
  /** The students whose attendance it may see; null for none. */
  attendanceVisible: SQL | null;
  /** The account's own resident part; null when it has none. */
  ownPart: ReactNode;
  /** The student the account belongs to, or null. */
  ownStudentId: string | null;
}) {
  // The server's clock in campus time, so every browser sees one state.
  const moment = new Date();
  const now = { day: campusDay(moment), time: campusTime(moment) };
  const params = readActivitiesParams(searchParams, now.day);
  const view = await loadActivitiesView(database(), params, {
    visible,
    mayCount,
    attendanceVisible,
    now,
  });
  return (
    <>
      <TabbedHead
        title="Asrama"
        tabs={tabs}
        lede="Jadwal kegiatan rutin dan non rutin para penghuni asrama."
      >
        {!mayManage && <ManagedNote />}
      </TabbedHead>
      {ownPart}
      <ActivityBoard
        params={params}
        view={view}
        now={now}
        form={mayManage ? { newActivityId: randomUUID() } : null}
        ownStudentId={ownStudentId}
      />
    </>
  );
}
