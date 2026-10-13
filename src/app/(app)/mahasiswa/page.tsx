import { rowLimitForPage } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { openGroupAddress } from "@/features/mentor-groups/open-group-address";
import { StudentNotesPanel } from "@/features/mentoring/student-notes-panel";
import { noteRowsFor } from "@/features/mentoring/visible-notes";
import { askedDetail } from "@/features/students/asked-detail";
import { readStudentListParams } from "@/features/students/student-list-address";
import { StudentListScreen } from "@/features/students/student-list-screen";
import { visibleTo } from "@/features/students/visible-students";

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
      morePanelsOf={(studentId) => (
        <StudentNotesPanel
          account={account}
          visible={notesVisible}
          studentId={studentId}
        />
      )}
    />
  );
}
