import { rowLimitFor } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { askedDetail } from "@/features/students/asked-detail";
import { readStudentListParams } from "@/features/students/student-list-address";
import { StudentListScreen } from "@/features/students/student-list-screen";

export default async function StudentsPage(props: PageProps<"/mahasiswa">) {
  const opened = await openPage("mahasiswa");
  const params = readStudentListParams(await props.searchParams);
  return (
    <StudentListScreen
      limit={rowLimitFor(opened.account)}
      params={params}
      detail={await askedDetail(opened.account, params.detailId)}
    />
  );
}
