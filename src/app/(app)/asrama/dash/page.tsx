import { forbidden } from "next/navigation";
import { may, rowLimitForAction } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { visibleTo } from "@/auth/visible-students";
import { database } from "@/db/database";
import { loadDormHealth } from "@/features/dorm/dashboard-health";
import { DashboardScreen } from "@/features/dorm/dashboard-screen";
import { loadDashboard } from "@/features/dorm/dashboard-view";
import { pageOf } from "@/features/dorm/leave-address";

/**
 * The tab Dashboard asrama. Its numbers count the students the account
 * sees through the roles that may see it: for Ketua Program Studi their
 * own students only. The names, Tujuan and rooms of those out of the
 * dorm are read only for an account with the right to them, among the
 * students that right lets it see. The health panels are read only for
 * an account with the right to each, among the residents it lets it see.
 */
export default async function DormDashboardPage(
  props: PageProps<"/asrama/dash">,
) {
  const opened = await openPage("asrama", "dash");
  const { account } = opened;
  if (!may(account.roles, "view_dorm_dashboard")) forbidden();
  const tabs = { pagePath: "asrama", tabs: opened.tabs, open: "dash" };
  const reader = {
    visible: visibleTo(rowLimitForAction(account, "view_dorm_dashboard")),
    namesVisible: may(account.roles, "view_dorm_dashboard_names")
      ? visibleTo(rowLimitForAction(account, "view_dorm_dashboard_names"))
      : null,
  };
  const db = database();
  const now = new Date();
  const [view, health] = await Promise.all([
    loadDashboard(db, reader, now, pageOf(await props.searchParams)),
    loadDormHealth(db, account, now),
  ]);
  return (
    <DashboardScreen
      tabs={tabs}
      view={view}
      health={health}
      mayCount={may(account.roles, "count_dorm_attendance")}
    />
  );
}
