import { forbidden } from "next/navigation";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import { may, rowLimitFor } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import {
  groupAddress,
  groupMemberAddress,
  readGroupListParams,
} from "@/features/mentor-groups/group-list-address";
import { GroupListScreen } from "@/features/mentor-groups/group-list-screen";
import { GroupScreen } from "@/features/mentor-groups/group-screen";
import { askedDetail } from "@/features/students/asked-detail";
import { StudentDetailDialog } from "@/features/students/student-detail-dialog";

/**
 * The page of one group, with the detail of a member over it when the
 * address asks for one. An account without the right to a student's
 * detail gets no link to it, and is refused when it asks by hand.
 */
async function GroupPage({
  account,
  groupId,
  detailId,
}: {
  account: Account;
  groupId: string;
  detailId: string | null;
}) {
  const mayOpenMember = may(account.roles, "view_student_detail");
  const detail = await askedDetail(account, detailId);
  return (
    <>
      <GroupScreen
        limit={rowLimitFor(account)}
        groupId={groupId}
        memberAddressOf={
          mayOpenMember
            ? (studentId) => groupMemberAddress(groupId, studentId)
            : null
        }
      />
      {detail && (
        <StudentDetailDialog
          detail={detail}
          period={await readRunningPeriod(database())}
          closeAddress={groupAddress(groupId)}
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
  if (!may(account.roles, "view_mentor_groups")) forbidden();
  const params = readGroupListParams(await props.searchParams);
  if (params.groupId !== null) {
    return (
      <GroupPage
        account={account}
        groupId={params.groupId}
        detailId={params.detailId}
      />
    );
  }
  return (
    <GroupListScreen
      tabs={{ pagePath: "pengasuh", tabs: opened.tabs, open: "kelompok" }}
      limit={rowLimitFor(account)}
      params={params}
    />
  );
}
