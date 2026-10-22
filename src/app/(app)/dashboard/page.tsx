import { campusDay } from "@/academic-periods/campus-day";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import { mayOpenTab } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { ASSESSMENT_ADDRESS } from "@/features/character-assessment/assessment-address";
import { readDashboardFilters } from "@/features/dashboard/dashboard-address";
import { dashboardScopeOf } from "@/features/dashboard/dashboard-scope";
import { DashboardScreen } from "@/features/dashboard/dashboard-screen";
import { loadDashboard } from "@/features/dashboard/dashboard-view";
import { FITNESS_ADDRESS } from "@/features/fitness/fitness-address";
import { EmptyPage } from "@/ui/empty-page";

/**
 * Dashboard. An account with the right to its numbers sees Dashboard
 * pembangunan karakter, Ketua Program Studi for their own program only.
 * The other role that opens the page, Pengasuh, sees Dashboard anak asuh,
 * which a later piece of work fills. The numbers are read here only, so
 * no other address gives them out.
 */
export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const { account } = await openPage("dashboard");
  const scope = dashboardScopeOf(account);
  if (scope === null) return <EmptyPage title="Dashboard anak asuh" />;
  const db = database();
  const today = campusDay();
  const view = await loadDashboard(
    db,
    scope,
    readDashboardFilters(await props.searchParams),
    await readRunningPeriod(db, today),
    today,
  );
  const { roles } = account;
  const opensAssessments = mayOpenTab(roles, "assessment", "character_test");
  const opensFitness = mayOpenTab(roles, "assessment", "fitness");
  return (
    <DashboardScreen
      view={view}
      links={{
        assessment: opensAssessments ? ASSESSMENT_ADDRESS : null,
        fitness: opensFitness ? FITNESS_ADDRESS : null,
      }}
    />
  );
}
