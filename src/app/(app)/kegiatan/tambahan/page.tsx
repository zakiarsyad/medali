import { may, rowLimitForTab } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { visibleTo } from "@/auth/visible-students";
import { readScheduleListParams } from "@/features/activities/schedule-list-address";
import { SchedulesScreen } from "@/features/activities/schedules-screen";

/**
 * The tab "Kegiatan tambahan": the schedules of the special and
 * additional activities. The attendance shown there is of the students
 * the account sees through the roles that open this tab: for Ketua
 * Program Studi and Pengasuh their own students only.
 */
export default async function ExtraSchedulesPage(
  props: PageProps<"/kegiatan/tambahan">,
) {
  const opened = await openPage("kegiatan", "tambahan");
  const params = readScheduleListParams(await props.searchParams, "extra");
  const { account } = opened;
  return (
    <SchedulesScreen
      tabs={{ pagePath: "kegiatan", tabs: opened.tabs, open: "tambahan" }}
      params={params}
      visible={visibleTo(rowLimitForTab(account, "activities", "extra"))}
      mayManage={may(account.roles, "manage_activities")}
    />
  );
}
