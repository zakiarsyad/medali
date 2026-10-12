import { forbidden } from "next/navigation";
import { may, rowLimitFor } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { readGroupListParams } from "@/features/mentor-groups/group-list-address";
import { GroupListScreen } from "@/features/mentor-groups/group-list-screen";

export default async function MentorGroupsPage(
  props: PageProps<"/pengasuh/kelompok">,
) {
  const opened = await openPage("pengasuh", "kelompok");
  const { account } = opened;
  if (!may(account.roles, "view_mentor_groups")) forbidden();
  return (
    <GroupListScreen
      tabs={{ pagePath: "pengasuh", tabs: opened.tabs, open: "kelompok" }}
      limit={rowLimitFor(account)}
      params={readGroupListParams(await props.searchParams)}
    />
  );
}
