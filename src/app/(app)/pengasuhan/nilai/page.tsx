import { forbidden } from "next/navigation";
import { openPage } from "@/auth/open-page";
import { detailVisibleTo, visibleTo } from "@/auth/visible-students";
import { StudentAchievementPanel } from "@/features/character-assessment/student-achievement-panel";
import { StudentGradePanel } from "@/features/character-grades/student-grade-panel";
import { baseScoreNow } from "@/features/curriculum/base-score-now";
import { StudentFitnessPanel } from "@/features/fitness/student-fitness-panel";
import { openGroupAddress } from "@/features/mentor-groups/open-group-address";
import { openMentorAddress } from "@/features/mentor-groups/open-mentor-address";
import {
  readScoresParams,
  scoresAddress,
} from "@/features/mentoring/scores-address";
import { ScoresScreen } from "@/features/mentoring/scores-screen";
import { StudentNotesPanel } from "@/features/mentoring/student-notes-panel";
import { noteRowsFor } from "@/features/mentoring/visible-notes";
import {
  givenRowsFor,
  scoreRowsFor,
} from "@/features/mentoring/visible-scores";
import { StudentSikuPanel } from "@/features/siku/student-siku-panel";
import { askedDetail } from "@/features/students/asked-detail";
import { runningPeriodNow } from "@/features/students/running-period-now";
import { StudentDetailDialog } from "@/features/students/student-detail-dialog";

/**
 * The tab "Nilai pengasuhan", with the detail of a mentee over it when
 * the address asks for one. The detail opens only for a student the
 * account may open: for Pengasuh, a student of a group they hold today.
 */
export default async function MentoringScoresPage(
  props: PageProps<"/pengasuhan/nilai">,
) {
  const opened = await openPage("pengasuhan", "nilai");
  const { account } = opened;
  const limit = scoreRowsFor(account);
  if (limit === null) forbidden();
  const params = readScoresParams(await props.searchParams);
  const detail = await askedDetail(account, params.detailId);
  const noteLimit = noteRowsFor(account);
  const notesVisible = noteLimit === null ? null : visibleTo(noteLimit);
  return (
    <>
      <ScoresScreen
        tabs={{ pagePath: "pengasuhan", tabs: opened.tabs, open: "nilai" }}
        limit={limit}
        giveLimit={givenRowsFor(account)}
        detailVisible={detailVisibleTo(account)}
        params={params}
      />
      {detail && (
        <StudentDetailDialog
          detail={detail}
          period={await runningPeriodNow()}
          openedFrom="scores_list"
          closeAddress={scoresAddress(params.groupId)}
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
              <StudentFitnessPanel account={account} studentId={studentId} />
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
