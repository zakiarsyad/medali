import { may, rowLimitForTab } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { readScheduleListParams } from "@/features/activities/schedule-list-address";
import { SchedulesScreen } from "@/features/activities/schedules-screen";
import { visibleTo } from "@/features/students/visible-students";

/**
 * The tab "Kegiatan PPKS". The attendance shown there is of the students
 * the account sees through the roles that open this tab: for Ketua
 * Program Studi and Pengasuh their own students only.
 */
export default async function PpksSchedulesPage(
  props: PageProps<"/kegiatan/ppks">,
) {
  const opened = await openPage("kegiatan", "ppks");
  const params = readScheduleListParams(await props.searchParams);
  const { account } = opened;
  return (
    <SchedulesScreen
      tabs={{ pagePath: "kegiatan", tabs: opened.tabs, open: "ppks" }}
      params={params}
      visible={visibleTo(rowLimitForTab(account, "activities", "ppks"))}
      mayManage={may(account.roles, "manage_activities")}
    />
  );
}
