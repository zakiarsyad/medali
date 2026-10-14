import { forbidden } from "next/navigation";
import { may, rowLimitForAction } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { pageOf, readLeaveListParams } from "@/features/dorm/leave-address";
import { readLeaveBoard } from "@/features/dorm/leave-list";
import { readOwnLeave } from "@/features/dorm/own-leave";
import { residentHeader } from "@/features/dorm/resident-header";
import { ResidentLeaveScreen } from "@/features/dorm/resident-leave-screen";
import { StaffLeaveScreen } from "@/features/dorm/staff-leave-screen";
import { visibleTo } from "@/features/students/visible-students";

/**
 * The tab Perizinan asrama. Staff see the requests of the students they
 * may see through the roles that may see leave: Ketua Program Studi
 * those of their own program only. A student who lives in the dorm asks
 * for leave and sees their own requests.
 */
export default async function DormLeavePage(props: PageProps<"/asrama/izin">) {
  const opened = await openPage("asrama", "izin");
  const { account } = opened;
  const tabs = { pagePath: "asrama", tabs: opened.tabs, open: "izin" };
  const searchParams = await props.searchParams;
  if (may(account.roles, "view_dorm_leave")) {
    const params = readLeaveListParams(searchParams);
    const visible = visibleTo(rowLimitForAction(account, "view_dorm_leave"));
    const board = await readLeaveBoard(
      database(),
      visible,
      params.filters,
      params.page,
      new Date(),
    );
    return <StaffLeaveScreen tabs={tabs} params={params} board={board} />;
  }
  const page = pageOf(searchParams);
  const answer = await readOwnLeave(database(), account, page, new Date());
  if (answer.kind === "refused") forbidden();
  return (
    <ResidentLeaveScreen
      tabs={tabs}
      room={await residentHeader(account.studentId)}
      leave={answer.leave}
      newLeaveId={crypto.randomUUID()}
    />
  );
}
