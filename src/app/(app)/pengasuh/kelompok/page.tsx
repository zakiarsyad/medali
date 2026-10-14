import { forbidden } from "next/navigation";
import type { RowLimit } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { openPage } from "@/auth/open-page";
import {
  groupAddress,
  readGroupListParams,
} from "@/features/mentor-groups/group-list-address";
import { GroupListScreen } from "@/features/mentor-groups/group-list-screen";
import { GroupScreen } from "@/features/mentor-groups/group-screen";
import { openEvaluationAddress } from "@/features/mentor-groups/open-evaluation-address";
import { openGroupAddress } from "@/features/mentor-groups/open-group-address";
import { openMemberAddresses } from "@/features/mentor-groups/open-member-address";
import { openMentorAddress } from "@/features/mentor-groups/open-mentor-address";
import { openReplacementAddress } from "@/features/mentor-groups/open-replacement-address";
import { evaluationRowsFor } from "@/features/mentor-groups/visible-evaluations";
import { groupRowsFor } from "@/features/mentor-groups/visible-groups";
import { mentorRowsFor } from "@/features/mentor-groups/visible-mentors";
import { StudentNotesPanel } from "@/features/mentoring/student-notes-panel";
import { noteRowsFor } from "@/features/mentoring/visible-notes";
import { askedDetail } from "@/features/students/asked-detail";
import { runningPeriodNow } from "@/features/students/running-period-now";
import { StudentDetailDialog } from "@/features/students/student-detail-dialog";
import {
  detailVisibleTo,
  visibleTo,
} from "@/features/students/visible-students";

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
  // Only for the notes shown in a member's detail. The count on the page
  // of the group does not ask for it: every account that opens the page
  // sees that number.
  const noteLimit = noteRowsFor(account);
  const notesVisible = noteLimit === null ? null : visibleTo(noteLimit);
  return (
    <>
      <GroupScreen
        limit={limit}
        evaluationLimit={evaluationRowsFor(account)}
        evaluateAddress={openEvaluationAddress(account, groupId)}
        replaceAddress={openReplacementAddress(account, groupId)}
        groupId={groupId}
        detailVisible={detailVisibleTo(account)}
        memberAddressOf={openMemberAddresses(account.roles, groupId)}
        mentorAddressOf={(mentorId, group) =>
          openMentorAddress(account, mentorId, group)
        }
      />
      {detail && (
        <StudentDetailDialog
          detail={detail}
          period={await runningPeriodNow()}
          openedFrom="group_page"
          closeAddress={groupAddress(groupId)}
          groupAddressOf={(group) => openGroupAddress(account, group)}
          mentorAddressOf={(mentorId, group) =>
            openMentorAddress(account, mentorId, group)
          }
          morePanelsOf={(studentId) => (
            <StudentNotesPanel
              account={account}
              visible={notesVisible}
              studentId={studentId}
            />
          )}
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
      evaluationLimit={evaluationRowsFor(account)}
      mentorLimit={mentorRowsFor(account)}
      params={params}
    />
  );
}
