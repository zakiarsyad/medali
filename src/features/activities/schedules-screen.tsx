import { randomUUID } from "node:crypto";
import { campusTime } from "@/academic-periods/campus-clock";
import { campusDay } from "@/academic-periods/campus-day";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import type { Database } from "@/db/connect";
import { database } from "@/db/database";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import { readActivityChoices } from "./activity-choices";
import { readCohortCounts } from "./cohort-counts";
import type { FormParts, FormPeriod } from "./form-values";
import { listSchedules } from "./list-schedules";
import { ScheduleBoard } from "./schedule-board";
import type { ScheduleListParams } from "./schedule-list-address";

/** The stored periods, with only what the form reads of each. */
async function readFormPeriods(db: Database): Promise<FormPeriod[]> {
  const periods = await readAcademicPeriods(db);
  return periods.map(({ startYear, term, startsOn }) => ({
    startYear,
    term,
    startsOn,
  }));
}

/** What only the form shows: the activities to choose from, and the periods. */
async function readFormLists(
  db: Database,
): Promise<Pick<FormParts, "choices" | "periods">> {
  const [choices, periods] = await Promise.all([
    readActivityChoices(db),
    readFormPeriods(db),
  ]);
  return { choices, periods };
}

/**
 * The tab "Kegiatan PPKS": the schedules of the PPKS activities, and for
 * an account that may manage activities the form that adds one.
 */
export async function SchedulesScreen({
  tabs,
  params,
  mayManage,
}: {
  tabs: TabLinksProps;
  params: ScheduleListParams;
  mayManage: boolean;
}) {
  const db = database();
  // The server's clock in campus time, so every browser sees one status.
  const moment = new Date();
  const now = { day: campusDay(moment), time: campusTime(moment) };
  const [list, counts, formLists] = await Promise.all([
    listSchedules(db, params.level, params.page),
    readCohortCounts(db),
    // Read only for an account that gets the form.
    mayManage ? readFormLists(db) : null,
  ]);
  const form: FormParts | null = formLists && {
    ...formLists,
    counts,
    today: now.day,
    newScheduleId: randomUUID(),
  };
  return (
    <>
      <PageHead title="Kegiatan karakter">
        Jadwal pelaksanaan program pembangunan karakter per semester. Program
        dan indikatornya diatur di menu Kurikulum. Kehadiran dihitung dari foto
        kehadiran yang diunggah mahasiswa dan divalidasi Pegawai UPK.
      </PageHead>
      <TabLinks {...tabs} />
      <ScheduleBoard
        list={list}
        level={params.level}
        counts={counts}
        now={now}
        form={form}
      />
    </>
  );
}
