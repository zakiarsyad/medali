import { randomUUID } from "node:crypto";
import type { SQL } from "drizzle-orm";
import { campusTime } from "@/academic-periods/campus-clock";
import { campusDay } from "@/academic-periods/campus-day";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import type { Database } from "@/db/connect";
import { database } from "@/db/database";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import { readActivityChoices } from "./activity-choices";
import { readAttendanceNumbers } from "./attendance-numbers";
import { AttendanceNumbersView } from "./attendance-numbers-view";
import { readClarificationPanel } from "./clarification-panel";
import { ClarificationPanelView } from "./clarification-panel-view";
import { readCohortCounts } from "./cohort-counts";
import type { FormParts, FormPeriod } from "./form-values";
import { readListAttendance } from "./list-attendance";
import { listSchedules } from "./list-schedules";
import { ScheduleBoard } from "./schedule-board";
import type { ScheduleKind, ScheduleListParams } from "./schedule-list-address";

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

/** The intro of each tab, before the line on how attendance is counted. */
const INTROS: Record<ScheduleKind, string> = {
  ppks: "Jadwal pelaksanaan program pembangunan karakter per semester. Program dan indikatornya diatur di menu Kurikulum.",
  extra:
    "Kegiatan khusus atau tambahan untuk mahasiswa tertentu, kelas, angkatan, atau lintas angkatan. Kegiatan harus terdaftar dulu di Kurikulum > Kegiatan khusus dan tambahan.",
};

/**
 * The tab "Kegiatan PPKS" or "Kegiatan tambahan", by the scope of its
 * params: the attendance numbers, the schedules of its activities with
 * how many attended, for an account that may manage activities the form
 * that adds one, and on "Kegiatan PPKS" the clarifications of the
 * students the account sees, when there are any. `visible` is the
 * students the account sees: every number of students and every name
 * here is read through it.
 */
export async function SchedulesScreen({
  tabs,
  params,
  visible,
  mayManage,
}: {
  tabs: TabLinksProps;
  params: ScheduleListParams;
  visible: SQL;
  mayManage: boolean;
}) {
  const db = database();
  // The server's clock in campus time, so every browser sees one status.
  const moment = new Date();
  const now = { day: campusDay(moment), time: campusTime(moment) };
  const { scope } = params;
  const [list, counts, formLists, numbers, clarifications] = await Promise.all([
    listSchedules(db, scope, params.page),
    readCohortCounts(db),
    // Read only for an account that gets the form.
    mayManage ? readFormLists(db) : null,
    readAttendanceNumbers(db, visible, scope, now.day),
    scope.kind === "ppks" ? readClarificationPanel(db, visible) : null,
  ]);
  // Asked only for the schedules of the page shown, so after the list.
  const attendance = await readListAttendance(
    db,
    visible,
    list.schedules,
    counts,
    params.open,
    now.day,
  );
  const form: FormParts | null = formLists && {
    ...formLists,
    counts,
    today: now.day,
    newScheduleId: randomUUID(),
  };
  return (
    <>
      <PageHead title="Kegiatan karakter">
        {INTROS[scope.kind]} Kehadiran dihitung dari foto kehadiran yang
        diunggah mahasiswa dan divalidasi Pegawai UPK.
      </PageHead>
      <TabLinks {...tabs} />
      <AttendanceNumbersView numbers={numbers} kind={scope.kind} />
      <ScheduleBoard
        list={list}
        scope={scope}
        counts={counts}
        now={now}
        attendance={attendance}
        form={form}
      />
      {clarifications && <ClarificationPanelView panel={clarifications} />}
    </>
  );
}
