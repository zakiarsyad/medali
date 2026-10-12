import { forbidden } from "next/navigation";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import type { RowLimit } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import {
  mentorAddress,
  readMentorListParams,
} from "@/features/mentor-groups/mentor-list-address";
import { MentorListScreen } from "@/features/mentor-groups/mentor-list-screen";
import { MentorScreen } from "@/features/mentor-groups/mentor-screen";
import { openGroupAddress } from "@/features/mentor-groups/open-group-address";
import { openMentorStudentAddresses } from "@/features/mentor-groups/open-member-address";
import { mentorRowsFor } from "@/features/mentor-groups/visible-mentors";
import { askedDetail } from "@/features/students/asked-detail";
import { StudentDetailDialog } from "@/features/students/student-detail-dialog";

/**
 * The page of one mentor, with the detail of a student over it when the
 * address asks for one. An account without the right to a student's
 * detail gets no link to it, and is refused when it asks by hand.
 */
async function MentorPage({
  account,
  limit,
  mentorId,
  detailId,
}: {
  account: Account;
  /** Which mentors the account may read. */
  limit: RowLimit;
  mentorId: string;
  detailId: string | null;
}) {
  const detail = await askedDetail(account, detailId);
  return (
    <>
      <MentorScreen
        limit={limit}
        mentorId={mentorId}
        studentAddressOf={openMentorStudentAddresses(account.roles, mentorId)}
      />
      {detail && (
        <StudentDetailDialog
          detail={detail}
          period={await readRunningPeriod(database())}
          closeAddress={mentorAddress(mentorId)}
          groupAddressOf={(group) => openGroupAddress(account, group)}
        />
      )}
    </>
  );
}

export default async function MentorsPage(
  props: PageProps<"/pengasuh/daftar">,
) {
  const opened = await openPage("pengasuh", "daftar");
  const { account } = opened;
  const limit = mentorRowsFor(account);
  if (limit === null) forbidden();
  const params = readMentorListParams(await props.searchParams);
  if (params.mentorId !== null) {
    return (
      <MentorPage
        account={account}
        limit={limit}
        mentorId={params.mentorId}
        detailId={params.detailId}
      />
    );
  }
  return (
    <MentorListScreen
      tabs={{ pagePath: "pengasuh", tabs: opened.tabs, open: "daftar" }}
      limit={limit}
      params={params}
    />
  );
}
