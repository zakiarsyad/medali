import { rowLimitForPage } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { visibleTo } from "@/auth/visible-students";
import { baseScoreNow } from "@/features/curriculum/base-score-now";
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
      morePanelsOf={(studentId) => (
        <>
          <StudentSikuPanel
            account={account}
            studentId={studentId}
            base={baseScoreNow()}
          />
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
