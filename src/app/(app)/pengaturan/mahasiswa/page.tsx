import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { readNewStudentsParams } from "@/features/students/new-students-address";
import { NewStudentsScreen } from "@/features/students/new-students-screen";

export default async function NewStudentsPage(
  props: PageProps<"/pengaturan/mahasiswa">,
) {
  const opened = await openPage("pengaturan", "mahasiswa");
  if (!may(opened.account.roles, "input_new_students")) forbidden();
  const params = readNewStudentsParams(await props.searchParams);
  return (
    <NewStudentsScreen
      params={params}
      tabs={{ pagePath: "pengaturan", tabs: opened.tabs, open: "mahasiswa" }}
      mayBeShownRoom={may(opened.account.roles, "view_student_room")}
    />
  );
}
