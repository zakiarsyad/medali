import { forbidden } from "next/navigation";
import { openPage } from "@/auth/open-page";
import { readMentorListParams } from "@/features/mentor-groups/mentor-list-address";
import { MentorListScreen } from "@/features/mentor-groups/mentor-list-screen";
import { mentorRowsFor } from "@/features/mentor-groups/visible-mentors";

export default async function MentorsPage(
  props: PageProps<"/pengasuh/daftar">,
) {
  const opened = await openPage("pengasuh", "daftar");
  const limit = mentorRowsFor(opened.account);
  if (limit === null) forbidden();
  const params = readMentorListParams(await props.searchParams);
  return (
    <MentorListScreen
      tabs={{ pagePath: "pengasuh", tabs: opened.tabs, open: "daftar" }}
      limit={limit}
      params={params}
    />
  );
}
