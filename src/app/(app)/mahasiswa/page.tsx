import { rowLimitFor } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { openGroupAddress } from "@/features/mentor-groups/open-group-address";
import { askedDetail } from "@/features/students/asked-detail";
import { readStudentListParams } from "@/features/students/student-list-address";
import { StudentListScreen } from "@/features/students/student-list-screen";

export default async function StudentsPage(props: PageProps<"/mahasiswa">) {
  const { account } = await openPage("mahasiswa");
  const params = readStudentListParams(await props.searchParams);
  return (
    <StudentListScreen
      limit={rowLimitFor(account)}
      params={params}
      detail={await askedDetail(account, params.detailId)}
      groupAddressOf={(group) => openGroupAddress(account, group)}
    />
  );
}
