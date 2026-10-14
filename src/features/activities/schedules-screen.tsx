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
import type { ExtraFormParts, FormParts, FormPeriod } from "./form-values";
import { readListAttendance } from "./list-attendance";
import { listSchedules } from "./list-schedules";
import type { ClassCount } from "./participant-draft";
import { readClassCounts, readPickedStudents } from "./participant-pool";
import type { CohortCount } from "./participants";
import { ScheduleBoard } from "./schedule-board";
import type { ScheduleKind, ScheduleListParams } from "./schedule-list-address";
import type { ScheduleRow } from "./schedule-row";

/** The stored periods, with only what the form reads of each. */
async function readFormPeriods(db: Database): Promise<FormPeriod[]> {
  const periods = await readAcademicPeriods(db);
  return periods.map(({ startYear, term, startsOn }) => ({
    startYear,
    term,
    startsOn,
  }));
}

/**
 * What only the form shows: the activities of the tab's kind to choose
 * from, the periods, and on "Kegiatan tambahan" the classes to pick.
 */
async function readFormLists(db: Database, kind: ScheduleKind) {
  const [choices, periods, classes] = await Promise.all([
    readActivityChoices(db, kind),
    readFormPeriods(db),
    kind === "extra" ? readClassCounts(db) : null,
  ]);
  return { choices, periods, classes };
}

/** The schedules of a page that name their students one by one. */
function byNameIds(schedules: readonly ScheduleRow[]): string[] {
  const ids: string[] = [];
  for (const { id, target } of schedules) {
    if (target.kind === "chosen" && target.choice.kind === "students") {
      ids.push(id);
    }
  }
  return ids;
}

/** The Peserta part of the form, or null on "Kegiatan PPKS". */
async function readExtraParts(
  db: Database,
  classes: ClassCount[] | null,
  cohorts: CohortCount[],
  schedules: readonly ScheduleRow[],
): Promise<ExtraFormParts | null> {
  if (classes === null) return null;
  const picked = await readPickedStudents(db, byNameIds(schedules));
  return { pool: { classes, cohorts }, picked };
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
 * that adds one, and the clarifications of the students the account sees
 * at the tab's activities, when there are any. `visible` is the
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
    mayManage ? readFormLists(db, scope.kind) : null,
    readAttendanceNumbers(db, visible, scope, now.day),
    readClarificationPanel(db, visible, scope.kind),
  ]);
  // Asked only for the schedules of the page shown, so after the list.
  const [attendance, extra] = await Promise.all([
    readListAttendance(
      db,
      visible,
      list.schedules,
      counts,
      params.open,
      now.day,
    ),
    formLists && readExtraParts(db, formLists.classes, counts, list.schedules),
  ]);
  const form: FormParts | null = formLists && {
    choices: formLists.choices,
    periods: formLists.periods,
    extra,
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
