import { rowLimitForPage } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { visibleTo } from "@/auth/visible-students";
import { database } from "@/db/database";
import { readSanctions } from "@/discipline-penalties/read-sanctions";
import { StudentSanctionBadge } from "@/discipline-penalties/student-sanction-badge";
import { ScoreHistoryPanel } from "@/features/character-assessment/score-history-panel";
import { StudentAchievementPanel } from "@/features/character-assessment/student-achievement-panel";
import { StudentGradePanel } from "@/features/character-grades/student-grade-panel";
import { StudentMentalPanel } from "@/features/counselling/student-mental-panel";
import { baseScoreNow } from "@/features/curriculum/base-score-now";
import { StudentFitnessPanel } from "@/features/fitness/student-fitness-panel";
import { StudentPenaltiesPanel } from "@/features/guidance/student-penalties-panel";
import { openGroupAddress } from "@/features/mentor-groups/open-group-address";
import { openMentorAddress } from "@/features/mentor-groups/open-mentor-address";
import { StudentNotesPanel } from "@/features/mentoring/student-notes-panel";
import { noteRowsFor } from "@/features/mentoring/visible-notes";
import { StudentSikuPanel } from "@/features/siku/student-siku-panel";
import { askedDetail } from "@/features/students/asked-detail";
import { readStudentListParams } from "@/features/students/student-list-address";
import { StudentListScreen } from "@/features/students/student-list-screen";

export default async function StudentsPage(props: PageProps<"/mahasiswa">) {
  const { account } = await openPage("mahasiswa");
  const params = readStudentListParams(await props.searchParams);
  const noteLimit = noteRowsFor(account);
  const notesVisible = noteLimit === null ? null : visibleTo(noteLimit);
  return (
    <StudentListScreen
      limit={rowLimitForPage(account, "students")}
      params={params}
      detail={await askedDetail(account, params.detailId)}
      groupAddressOf={(group) => openGroupAddress(account, group)}
      mentorAddressOf={(mentorId, group) =>
        openMentorAddress(account, mentorId, group)
      }
      sanctionsOf={(ids) => readSanctions(database(), account, ids)}
      headTagsOf={(studentId) => (
        <StudentSanctionBadge account={account} studentId={studentId} />
      )}
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
