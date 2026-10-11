import { rowLimitFor } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { StudentListScreen } from "@/features/students/student-list-screen";

export default async function StudentsPage() {
  const opened = await openPage("mahasiswa");
  return <StudentListScreen limit={rowLimitFor(opened.account)} />;
}
