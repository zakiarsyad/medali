import { forbidden } from "next/navigation";
import type { RowLimit } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { openPage } from "@/auth/open-page";
import { detailVisibleTo, visibleTo } from "@/auth/visible-students";
import { USERS_ADDRESS } from "@/features/accounts/list-address";
import { ScoreHistoryPanel } from "@/features/character-assessment/score-history-panel";
import { StudentAchievementPanel } from "@/features/character-assessment/student-achievement-panel";
import { StudentGradePanel } from "@/features/character-grades/student-grade-panel";
import { StudentMentalPanel } from "@/features/counselling/student-mental-panel";
import { baseScoreNow } from "@/features/curriculum/base-score-now";
import { StudentFitnessPanel } from "@/features/fitness/student-fitness-panel";
import {
  mentorAddress,
  readMentorListParams,
} from "@/features/mentor-groups/mentor-list-address";
import { MentorListScreen } from "@/features/mentor-groups/mentor-list-screen";
import { MentorScreen } from "@/features/mentor-groups/mentor-screen";
import { newMentorsAddress } from "@/features/mentor-groups/new-mentors-address";
import { openGroupAddress } from "@/features/mentor-groups/open-group-address";
import { openMentorStudentAddresses } from "@/features/mentor-groups/open-member-address";
import { openMentorAddress } from "@/features/mentor-groups/open-mentor-address";
import { evaluationRowsFor } from "@/features/mentor-groups/visible-evaluations";
import { mentorRowsFor } from "@/features/mentor-groups/visible-mentors";
import { StudentNotesPanel } from "@/features/mentoring/student-notes-panel";
import { noteRowsFor } from "@/features/mentoring/visible-notes";
import { StudentSikuPanel } from "@/features/siku/student-siku-panel";
import { askedDetail } from "@/features/students/asked-detail";
import { runningPeriodNow } from "@/features/students/running-period-now";
import { StudentDetailDialog } from "@/features/students/student-detail-dialog";

/**
 * The page of one mentor, with the detail of a student over it when the
 * address asks for one. An account without the right to a student's
 * detail gets no link to it, and is refused when it asks by hand.
 */
async function MentorPage({
  account,
  limit,
  mentorId,
  detailId,
}: {
  account: Account;
  /** Which mentors the account may read. */
  limit: RowLimit;
  mentorId: string;
  detailId: string | null;
}) {
  const detail = await askedDetail(account, detailId);
  const noteLimit = noteRowsFor(account);
  const notesVisible = noteLimit === null ? null : visibleTo(noteLimit);
  return (
    <>
      <MentorScreen
        limit={limit}
        evaluationLimit={evaluationRowsFor(account)}
        mentorId={mentorId}
        detailVisible={detailVisibleTo(account)}
        studentAddressOf={openMentorStudentAddresses(account.roles, mentorId)}
      />
      {detail && (
        <StudentDetailDialog
          detail={detail}
          period={await runningPeriodNow()}
          openedFrom="mentor_page"
          closeAddress={mentorAddress(mentorId)}
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

export default async function MentorsPage(
  props: PageProps<"/pengasuh/daftar">,
) {
  const opened = await openPage("pengasuh", "daftar");
  const { account } = opened;
  const limit = mentorRowsFor(account);
  if (limit === null) forbidden();
  const params = readMentorListParams(await props.searchParams);
  if (params.mentorId !== null) {
    return (
      <MentorPage
        account={account}
        limit={limit}
        mentorId={params.mentorId}
        detailId={params.detailId}
      />
    );
  }
  return (
    <MentorListScreen
      tabs={{ pagePath: "pengasuh", tabs: opened.tabs, open: "daftar" }}
      limit={limit}
      evaluationLimit={evaluationRowsFor(account)}
      params={params}
      usersAddress={newMentorsAddress(account.roles, USERS_ADDRESS)}
    />
  );
}
