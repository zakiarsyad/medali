import { campusDay } from "@/academic-periods/campus-day";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import { type AccountForAccess, mayOpenPage, mayOpenTab } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import type { PageId } from "@/auth/pages";
import { visibleTo } from "@/auth/visible-students";
import { database } from "@/db/database";
import { StudentSanctionBadge } from "@/discipline-penalties/student-sanction-badge";
import { ASSESSMENT_ADDRESS } from "@/features/character-assessment/assessment-address";
import { ScoreHistoryPanel } from "@/features/character-assessment/score-history-panel";
import { StudentAchievementPanel } from "@/features/character-assessment/student-achievement-panel";
import { GRADE_ADDRESS } from "@/features/character-grades/grade-address";
import { StudentGradePanel } from "@/features/character-grades/student-grade-panel";
import { SCREENING_ADDRESS } from "@/features/counselling/screening-address";
import { StudentMentalPanel } from "@/features/counselling/student-mental-panel";
import { baseScoreNow } from "@/features/curriculum/base-score-now";
import {
  dashboardAddress,
  readDashboardDetail,
  readDashboardFilters,
} from "@/features/dashboard/dashboard-address";
import { dashboardScopeOf } from "@/features/dashboard/dashboard-scope";
import {
  DashboardScreen,
  type DetailLinks,
} from "@/features/dashboard/dashboard-screen";
import { loadDashboard } from "@/features/dashboard/dashboard-view";
import { FITNESS_ADDRESS } from "@/features/fitness/fitness-address";
import { StudentFitnessPanel } from "@/features/fitness/student-fitness-panel";
import { COACHING_ADDRESS } from "@/features/guidance/coaching-address";
import { StudentCoachingPanel } from "@/features/guidance/student-coaching-panel";
import { StudentPenaltiesPanel } from "@/features/guidance/student-penalties-panel";
import { MENTOR_LIST_ADDRESS } from "@/features/mentor-groups/mentor-list-address";
import { openGroupAddress } from "@/features/mentor-groups/open-group-address";
import { openMentorAddress } from "@/features/mentor-groups/open-mentor-address";
import { NOTES_ADDRESS } from "@/features/mentoring/notes-address";
import { StudentNotesPanel } from "@/features/mentoring/student-notes-panel";
import { noteRowsFor } from "@/features/mentoring/visible-notes";
import { StudentSikuPanel } from "@/features/siku/student-siku-panel";
import {
  type AskedDetail,
  askedDetail,
} from "@/features/students/asked-detail";
import { runningPeriodNow } from "@/features/students/running-period-now";
import { StudentDetailDialog } from "@/features/students/student-detail-dialog";
import { STUDENT_LIST_ADDRESS } from "@/features/students/student-list-address";
import { EmptyPage } from "@/ui/empty-page";

function linksOf(roles: AccountForAccess["roles"]): DetailLinks {
  const opens = (page: PageId, tab: string) => mayOpenTab(roles, page, tab);
  return {
    assessment: opens("assessment", "character_test")
      ? ASSESSMENT_ADDRESS
      : null,
    grade: opens("assessment", "character") ? GRADE_ADDRESS : null,
    fitness: opens("assessment", "fitness") ? FITNESS_ADDRESS : null,
    mental: opens("assessment", "mental_health") ? SCREENING_ADDRESS : null,
    students: mayOpenPage(roles, "students") ? STUDENT_LIST_ADDRESS : null,
    mentors: opens("mentors", "mentors") ? MENTOR_LIST_ADDRESS : null,
    notes: opens("mentoring", "notes") ? NOTES_ADDRESS : null,
    coaching: opens("guidance", "character") ? COACHING_ADDRESS : null,
  };
}

/** A student's detail over the Dashboard, opened from a name of a note, as in Mahasiswa. */
async function DashboardDetail({
  account,
  detail,
  closeAddress,
}: {
  account: AccountForAccess;
  detail: AskedDetail;
  closeAddress: string;
}) {
  const noteLimit = noteRowsFor(account);
  const notesVisible = noteLimit === null ? null : visibleTo(noteLimit);
  return (
    <StudentDetailDialog
      detail={detail}
      period={await runningPeriodNow()}
      openedFrom="dashboard"
      headTagsOf={(studentId) => (
        <StudentSanctionBadge account={account} studentId={studentId} />
      )}
      closeAddress={closeAddress}
      groupAddressOf={(group) => openGroupAddress(account, group)}
      mentorAddressOf={(mentorId, group) =>
        openMentorAddress(account, mentorId, group)
      }
      morePanelsOf={(studentId) => (
        <>
          <StudentAchievementPanel account={account} studentId={studentId} />
          <StudentGradePanel account={account} studentId={studentId} />
          <StudentSikuPanel
            account={account}
            studentId={studentId}
            base={baseScoreNow()}
          />
          <StudentPenaltiesPanel account={account} studentId={studentId} />
          <ScoreHistoryPanel account={account} studentId={studentId} />
          <StudentCoachingPanel account={account} studentId={studentId} />
          <StudentFitnessPanel account={account} studentId={studentId} />
          <StudentMentalPanel account={account} studentId={studentId} />
          <StudentNotesPanel
            account={account}
            visible={notesVisible}
            studentId={studentId}
          />
        </>
      )}
    />
  );
}

/**
 * Dashboard. An account with the right to its numbers sees Dashboard
 * pembangunan karakter, Ketua Program Studi for their own program only.
 * The other role that opens the page, Pengasuh, sees Dashboard anak asuh,
 * which a later piece of work fills. The numbers are read here only, so
 * no other address gives them out. A name of a note opens the student's
 * detail over the page, for a student the account may open the detail
 * of; any other is "not found".
 */
export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const { account } = await openPage("dashboard");
  const scope = dashboardScopeOf(account);
  if (scope === null) return <EmptyPage title="Dashboard anak asuh" />;
  const db = database();
  const today = campusDay();
  const params = await props.searchParams;
  const view = await loadDashboard(
    db,
    scope,
    readDashboardFilters(params),
    await readRunningPeriod(db, today),
    today,
  );
  const detail = await askedDetail(account, readDashboardDetail(params));
  return (
    <>
      <DashboardScreen view={view} links={linksOf(account.roles)} />
      {detail && (
        <DashboardDetail
          account={account}
          detail={detail}
          closeAddress={dashboardAddress(view.filters)}
        />
      )}
    </>
  );
}
