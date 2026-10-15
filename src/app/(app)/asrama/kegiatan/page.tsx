import { forbidden } from "next/navigation";
import { may, rowLimitForAction } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { visibleTo } from "@/auth/visible-students";
import { database } from "@/db/database";
import { ActivitiesScreen } from "@/features/dorm/activities-screen";
import { readOwnWarning } from "@/features/dorm/own-warning";
import { ActivitiesWarning } from "@/features/dorm/own-warning-view";
import { readResidentActivities } from "@/features/dorm/resident-activities";
import { ResidentActivitiesView } from "@/features/dorm/resident-activities-view";
import { readOwnAttendance } from "@/features/dorm/resident-attendance";
import { residentHeader } from "@/features/dorm/resident-header";
import { PageHead } from "@/ui/page-head";
import { TabLinks } from "@/ui/tab-links";

/**
 * The tab Kegiatan asrama. Staff see the schedule; the Peserta are
 * counted among the students the account sees through the roles that may
 * see it: for Ketua Program Studi their own students only. A student who
 * lives in the dorm sees today's and the next activities of their group,
 * and their own attendance, with a warning when a clarification of
 * theirs was rejected or they have an SP.
 */
export default async function DormActivitiesPage(
  props: PageProps<"/asrama/kegiatan">,
) {
  const opened = await openPage("asrama", "kegiatan");
  const { account } = opened;
  const tabs = { pagePath: "asrama", tabs: opened.tabs, open: "kegiatan" };
  if (may(account.roles, "view_dorm_activities")) {
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
      />
    );
  }
  const moment = new Date();
  const answer = await readResidentActivities(database(), account, moment);
  if (answer.kind === "refused") forbidden();
  const [own, warning] = await Promise.all([
    may(account.roles, "view_own_dorm_attendance")
      ? readOwnAttendance(database(), account, moment)
      : null,
    readOwnWarning(database(), account, moment),
  ]);
  return (
    <>
      <PageHead title="Kegiatan asrama">
        {await residentHeader(account.studentId)}
      </PageHead>
      <TabLinks {...tabs} />
      {warning !== null && <ActivitiesWarning warning={warning} />}
      <ResidentActivitiesView
        activities={answer.activities}
        attendance={own?.kind === "shown" ? own.attendance : null}
      />
    </>
  );
}
