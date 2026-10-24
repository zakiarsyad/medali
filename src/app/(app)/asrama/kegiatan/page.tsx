import { forbidden } from "next/navigation";
import { may, rowLimitForAction } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { openPage } from "@/auth/open-page";
import { visibleTo } from "@/auth/visible-students";
import { database } from "@/db/database";
import { ActivitiesScreen } from "@/features/dorm/activities-screen";
import { activitiesScreensOf } from "@/features/dorm/activities-screens";
import { readOwnWarning } from "@/features/dorm/own-warning";
import { ActivitiesWarning } from "@/features/dorm/own-warning-view";
import { readResidentActivities } from "@/features/dorm/resident-activities";
import { ResidentActivitiesView } from "@/features/dorm/resident-activities-view";
import { readOwnAttendance } from "@/features/dorm/resident-attendance";
import { residentHeader } from "@/features/dorm/resident-header";
import { TabbedHead } from "@/ui/tabbed-head";

/**
 * The resident part: today's and the next activities of the student's
 * group, and their own attendance, with a warning when a clarification
 * of theirs was rejected or they have an SP. Null for an account whose
 * roles give no resident part, or whose student lives in no dorm today.
 */
async function residentPartOf(account: Account, moment: Date) {
  if (!activitiesScreensOf(account.roles).own) return null;
  const answer = await readResidentActivities(database(), account, moment);
  if (answer.kind === "refused") return null;
  const [own, warning] = await Promise.all([
    may(account.roles, "view_own_dorm_attendance")
      ? readOwnAttendance(database(), account, moment)
      : null,
    readOwnWarning(database(), account, moment),
  ]);
  return (
    <>
      {warning !== null && <ActivitiesWarning warning={warning} />}
      <ResidentActivitiesView
        activities={answer.activities}
        attendance={own?.kind === "shown" ? own.attendance : null}
      />
    </>
  );
}

/**
 * The tab Kegiatan asrama. Staff see the schedule; the Peserta are
 * counted among the students the account sees through the roles that may
 * see it: for Ketua Program Studi their own students only. A student who
 * lives in the dorm sees the resident part. A resident who is also staff
 * sees the resident part above the staff screen.
 */
export default async function DormActivitiesPage(
  props: PageProps<"/asrama/kegiatan">,
) {
  const opened = await openPage("asrama", "kegiatan");
  const { account } = opened;
  const tabs = { pagePath: "asrama", tabs: opened.tabs, open: "kegiatan" };
  const residentPart = await residentPartOf(account, new Date());
  if (activitiesScreensOf(account.roles).staff) {
    return (
      <ActivitiesScreen
        tabs={tabs}
        searchParams={await props.searchParams}
        visible={visibleTo(rowLimitForAction(account, "view_dorm_activities"))}
        mayManage={may(account.roles, "manage_dorm_activities")}
        mayCount={may(account.roles, "count_dorm_attendance")}
        attendanceVisible={
          may(account.roles, "view_dorm_attendance")
            ? visibleTo(rowLimitForAction(account, "view_dorm_attendance"))
            : null
        }
        ownPart={residentPart}
        ownStudentId={account.studentId}
      />
    );
  }
  if (residentPart === null) forbidden();
  return (
    <>
      <TabbedHead
        title="Asrama"
        tabs={tabs}
        lede={await residentHeader(account.studentId)}
      />
      {residentPart}
    </>
  );
}
