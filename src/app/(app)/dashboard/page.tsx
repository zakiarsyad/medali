import { campusDay } from "@/academic-periods/campus-day";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import { mayOpenPage, mayOpenTab } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { ASSESSMENT_ADDRESS } from "@/features/character-assessment/assessment-address";
import { GRADE_ADDRESS } from "@/features/character-grades/grade-address";
import { SCREENING_ADDRESS } from "@/features/counselling/screening-address";
import { readDashboardFilters } from "@/features/dashboard/dashboard-address";
import { dashboardScopeOf } from "@/features/dashboard/dashboard-scope";
import { DashboardScreen } from "@/features/dashboard/dashboard-screen";
import { loadDashboard } from "@/features/dashboard/dashboard-view";
import { FITNESS_ADDRESS } from "@/features/fitness/fitness-address";
import { COACHING_ADDRESS } from "@/features/guidance/coaching-address";
import { MENTOR_LIST_ADDRESS } from "@/features/mentor-groups/mentor-list-address";
import { NOTES_ADDRESS } from "@/features/mentoring/notes-address";
import { STUDENT_LIST_ADDRESS } from "@/features/students/student-list-address";
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
  const opensGrades = mayOpenTab(roles, "assessment", "character");
  const opensFitness = mayOpenTab(roles, "assessment", "fitness");
  const opensMental = mayOpenTab(roles, "assessment", "mental_health");
  const opensStudents = mayOpenPage(roles, "students");
  const opensMentors = mayOpenTab(roles, "mentors", "mentors");
  const opensNotes = mayOpenTab(roles, "mentoring", "notes");
  const opensCoaching = mayOpenTab(roles, "guidance", "character");
  return (
    <DashboardScreen
      view={view}
      links={{
        assessment: opensAssessments ? ASSESSMENT_ADDRESS : null,
        grade: opensGrades ? GRADE_ADDRESS : null,
        fitness: opensFitness ? FITNESS_ADDRESS : null,
        mental: opensMental ? SCREENING_ADDRESS : null,
        students: opensStudents ? STUDENT_LIST_ADDRESS : null,
        mentors: opensMentors ? MENTOR_LIST_ADDRESS : null,
        notes: opensNotes ? NOTES_ADDRESS : null,
        coaching: opensCoaching ? COACHING_ADDRESS : null,
      }}
    />
  );
}
