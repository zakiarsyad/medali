import { may, rowLimitForAction } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { ActivitiesScreen } from "@/features/dorm/activities-screen";
import { residentHeader } from "@/features/dorm/resident-header";
import { visibleTo } from "@/features/students/visible-students";
import { EmptyPage } from "@/ui/empty-page";

/**
 * The tab Kegiatan asrama. Staff see the schedule; the Peserta are
 * counted among the students the account sees through the roles that may
 * see it: for Ketua Program Studi their own students only.
 */
export default async function DormActivitiesPage(
  props: PageProps<"/asrama/kegiatan">,
) {
  const opened = await openPage("asrama", "kegiatan");
  const { account } = opened;
  const tabs = { pagePath: "asrama", tabs: opened.tabs, open: "kegiatan" };
  if (!may(account.roles, "view_dorm_activities")) {
    return (
      <EmptyPage
        title={opened.page.title}
        lede={await residentHeader(account.studentId)}
        tabs={tabs}
      />
    );
  }
  return (
    <ActivitiesScreen
      tabs={tabs}
      searchParams={await props.searchParams}
      visible={visibleTo(rowLimitForAction(account, "view_dorm_activities"))}
      mayManage={may(account.roles, "manage_dorm_activities")}
    />
  );
}
