import { forbidden } from "next/navigation";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import type { RowLimit } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import {
  groupAddress,
  readGroupListParams,
} from "@/features/mentor-groups/group-list-address";
import { GroupListScreen } from "@/features/mentor-groups/group-list-screen";
import { GroupScreen } from "@/features/mentor-groups/group-screen";
import { openGroupAddress } from "@/features/mentor-groups/open-group-address";
import { openMemberAddresses } from "@/features/mentor-groups/open-member-address";
import { groupRowsFor } from "@/features/mentor-groups/visible-groups";
import { askedDetail } from "@/features/students/asked-detail";
import { StudentDetailDialog } from "@/features/students/student-detail-dialog";
import { detailVisibleTo } from "@/features/students/visible-students";

/**
 * The page of one group, with the detail of a member over it when the
 * address asks for one. An account without the right to a student's
 * detail gets no link to it, and is refused when it asks by hand.
 */
async function GroupPage({
  account,
  limit,
  groupId,
  detailId,
}: {
  account: Account;
  /** Which groups the account may read. */
  limit: RowLimit;
  groupId: string;
  detailId: string | null;
}) {
  const detail = await askedDetail(account, detailId);
  return (
    <>
      <GroupScreen
        limit={limit}
        groupId={groupId}
        detailVisible={detailVisibleTo(account)}
        memberAddressOf={openMemberAddresses(account.roles, groupId)}
      />
      {detail && (
        <StudentDetailDialog
          detail={detail}
          period={await readRunningPeriod(database())}
          closeAddress={groupAddress(groupId)}
          groupAddressOf={(group) => openGroupAddress(account, group)}
        />
      )}
    </>
  );
}

export default async function MentorGroupsPage(
  props: PageProps<"/pengasuh/kelompok">,
) {
  const opened = await openPage("pengasuh", "kelompok");
  const { account } = opened;
  const limit = groupRowsFor(account);
  if (limit === null) forbidden();
  const params = readGroupListParams(await props.searchParams);
  if (params.groupId !== null) {
    return (
      <GroupPage
        account={account}
        limit={limit}
        groupId={params.groupId}
        detailId={params.detailId}
      />
    );
  }
  return (
    <GroupListScreen
      tabs={{ pagePath: "pengasuh", tabs: opened.tabs, open: "kelompok" }}
      limit={limit}
      params={params}
    />
  );
}
