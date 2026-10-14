import { forbidden } from "next/navigation";
import { may, rowLimitForAction } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { ActivitiesScreen } from "@/features/dorm/activities-screen";
import { readResidentActivities } from "@/features/dorm/resident-activities";
import { ResidentActivitiesView } from "@/features/dorm/resident-activities-view";
import { residentHeader } from "@/features/dorm/resident-header";
import { visibleTo } from "@/features/students/visible-students";
import { PageHead } from "@/ui/page-head";
import { TabLinks } from "@/ui/tab-links";

/**
 * The tab Kegiatan asrama. Staff see the schedule; the Peserta are
 * counted among the students the account sees through the roles that may
 * see it: for Ketua Program Studi their own students only. A student who
 * lives in the dorm sees today's and the next activities of their group.
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
      />
    );
  }
  const answer = await readResidentActivities(database(), account, new Date());
  if (answer.kind === "refused") forbidden();
  return (
    <>
      <PageHead title="Kegiatan asrama">
        {await residentHeader(account.studentId)}
      </PageHead>
      <TabLinks {...tabs} />
      <ResidentActivitiesView activities={answer.activities} />
    </>
  );
}
