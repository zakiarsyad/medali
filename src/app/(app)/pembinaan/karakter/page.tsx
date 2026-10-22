import { forbidden } from "next/navigation";
import { campusDay } from "@/academic-periods/campus-day";
import { openPage } from "@/auth/open-page";
import { visibleTo } from "@/auth/visible-students";
import { database } from "@/db/database";
import { StudentSanctionBadge } from "@/discipline-penalties/student-sanction-badge";
import { ScoreHistoryPanel } from "@/features/character-assessment/score-history-panel";
import { StudentAchievementPanel } from "@/features/character-assessment/student-achievement-panel";
import { StudentGradePanel } from "@/features/character-grades/student-grade-panel";
import { StudentMentalPanel } from "@/features/counselling/student-mental-panel";
import { baseScoreNow } from "@/features/curriculum/base-score-now";
import { StudentFitnessPanel } from "@/features/fitness/student-fitness-panel";
import {
  coachingAddress,
  readCoachingParams,
} from "@/features/guidance/coaching-address";
import { readCoachingBoard } from "@/features/guidance/coaching-board";
import { CoachingScreen } from "@/features/guidance/coaching-screen";
import { StudentCoachingPanel } from "@/features/guidance/student-coaching-panel";
import { StudentPenaltiesPanel } from "@/features/guidance/student-penalties-panel";
import { openGroupAddress } from "@/features/mentor-groups/open-group-address";
import { openMentorAddress } from "@/features/mentor-groups/open-mentor-address";
import { StudentNotesPanel } from "@/features/mentoring/student-notes-panel";
import { noteRowsFor } from "@/features/mentoring/visible-notes";
import { StudentSikuPanel } from "@/features/siku/student-siku-panel";
import { askedDetail } from "@/features/students/asked-detail";
import { runningPeriodNow } from "@/features/students/running-period-now";
import { StudentDetailDialog } from "@/features/students/student-detail-dialog";

/**
 * The tab Pembinaan karakter. Kepala Unit, Direktur, Ketua Program Studi
 * and Pengasuh see the Aktif students whose latest assessment lists them
 * for coaching, each within the rows of its roles that open the tab:
 * Ketua Program Studi their own program only, Pengasuh their own
 * mentees only. No other role opens the tab. A name opens the student's
 * detail over the tab, for a student the account may open the detail of;
 * any other is "not found".
 */
export default async function CharacterCoachingPage(
  props: PageProps<"/pembinaan/karakter">,
) {
  const opened = await openPage("pembinaan", "karakter");
  const { account } = opened;
  const params = readCoachingParams(await props.searchParams);
  const board = await readCoachingBoard(
    database(),
    account,
    params,
    campusDay(),
  );
  if (board === null) forbidden();
  const profile = await askedDetail(account, params.profileId);
  const noteLimit = noteRowsFor(account);
  const notesVisible = noteLimit === null ? null : visibleTo(noteLimit);
  return (
    <>
      <CoachingScreen
        tabs={{ pagePath: "pembinaan", tabs: opened.tabs, open: "karakter" }}
        board={board}
        params={params}
      />
      {profile && (
        <StudentDetailDialog
          detail={profile}
          period={await runningPeriodNow()}
          openedFrom="character_coaching_list"
          headTagsOf={(studentId) => (
            <StudentSanctionBadge account={account} studentId={studentId} />
          )}
          closeAddress={coachingAddress({ ...params, profileId: null })}
          groupAddressOf={(group) => openGroupAddress(account, group)}
          mentorAddressOf={(mentorId, group) =>
            openMentorAddress(account, mentorId, group)
          }
          morePanelsOf={(studentId) => (
            <>
              <StudentAchievementPanel
                account={account}
                studentId={studentId}
              />
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
      )}
    </>
  );
}
