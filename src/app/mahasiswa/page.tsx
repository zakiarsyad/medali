import { rowLimitFor } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { readStudentListParams } from "@/features/students/student-list-address";
import { StudentListScreen } from "@/features/students/student-list-screen";

export default async function StudentsPage(props: PageProps<"/mahasiswa">) {
  const opened = await openPage("mahasiswa");
  return (
    <StudentListScreen
      limit={rowLimitFor(opened.account)}
      params={readStudentListParams(await props.searchParams)}
    />
  );
}
