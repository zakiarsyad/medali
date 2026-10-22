import { forbidden } from "next/navigation";
import { openPage } from "@/auth/open-page";
import { detailVisibleTo, visibleTo } from "@/auth/visible-students";
import { ScoreHistoryPanel } from "@/features/character-assessment/score-history-panel";
import { StudentAchievementPanel } from "@/features/character-assessment/student-achievement-panel";
import { StudentGradePanel } from "@/features/character-grades/student-grade-panel";
import { StudentMentalPanel } from "@/features/counselling/student-mental-panel";
import { baseScoreNow } from "@/features/curriculum/base-score-now";
import { StudentFitnessPanel } from "@/features/fitness/student-fitness-panel";
import { openGroupAddress } from "@/features/mentor-groups/open-group-address";
import { openMentorAddress } from "@/features/mentor-groups/open-mentor-address";
import {
  notesAddress,
  readNotesParams,
} from "@/features/mentoring/notes-address";
import { NotesScreen } from "@/features/mentoring/notes-screen";
import { StudentNotesPanel } from "@/features/mentoring/student-notes-panel";
import {
  noteRowsFor,
  writtenRowsFor,
} from "@/features/mentoring/visible-notes";
import { StudentSikuPanel } from "@/features/siku/student-siku-panel";
import { askedDetail } from "@/features/students/asked-detail";
import { runningPeriodNow } from "@/features/students/running-period-now";
import { StudentDetailDialog } from "@/features/students/student-detail-dialog";

/**
 * The tab "Catatan pendampingan", with the detail of a student over it
 * when the address asks for one. The detail opens only for a student the
 * account may open: for Pengasuh, a student of a group they hold today.
 */
export default async function MentoringNotesPage(
  props: PageProps<"/pengasuhan/catatan">,
) {
  const opened = await openPage("pengasuhan", "catatan");
  const { account } = opened;
  const limit = noteRowsFor(account);
  if (limit === null) forbidden();
  const params = readNotesParams(await props.searchParams);
  const visible = visibleTo(limit);
  const detail = await askedDetail(account, params.detailId);
  return (
    <>
      <NotesScreen
        tabs={{ pagePath: "pengasuhan", tabs: opened.tabs, open: "catatan" }}
        visible={visible}
        detailVisible={detailVisibleTo(account)}
        writeLimit={writtenRowsFor(account)}
        params={params}
      />
      {detail && (
        <StudentDetailDialog
          detail={detail}
          period={await runningPeriodNow()}
          openedFrom="notes_list"
          closeAddress={notesAddress(params.kind, params.page)}
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
              <ScoreHistoryPanel account={account} studentId={studentId} />
              <StudentFitnessPanel account={account} studentId={studentId} />
              <StudentMentalPanel account={account} studentId={studentId} />
              <StudentNotesPanel
                account={account}
                visible={visible}
                studentId={studentId}
              />
            </>
          )}
        />
      )}
    </>
  );
}
