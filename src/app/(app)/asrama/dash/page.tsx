import { forbidden } from "next/navigation";
import { may, rowLimitForAction } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { visibleTo } from "@/auth/visible-students";
import { database } from "@/db/database";
import { DashboardScreen } from "@/features/dorm/dashboard-screen";
import { loadDashboard } from "@/features/dorm/dashboard-view";
import { pageOf } from "@/features/dorm/leave-address";

/**
 * The tab Dashboard asrama. Its numbers count the students the account
 * sees through the roles that may see it: for Ketua Program Studi their
 * own students only.
 */
export default async function DormDashboardPage(
  props: PageProps<"/asrama/dash">,
) {
  const opened = await openPage("asrama", "dash");
  const { account } = opened;
  if (!may(account.roles, "view_dorm_dashboard")) forbidden();
  const tabs = { pagePath: "asrama", tabs: opened.tabs, open: "dash" };
  const view = await loadDashboard(
    database(),
    { visible: visibleTo(rowLimitForAction(account, "view_dorm_dashboard")) },
    new Date(),
    pageOf(await props.searchParams),
  );
  return (
    <DashboardScreen
      tabs={tabs}
      view={view}
      mayCount={may(account.roles, "count_dorm_attendance")}
    />
  );
}
