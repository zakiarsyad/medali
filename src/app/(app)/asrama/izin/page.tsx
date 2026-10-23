import { forbidden } from "next/navigation";
import { may, rowLimitForAction } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { openPage } from "@/auth/open-page";
import { visibleTo } from "@/auth/visible-students";
import { database } from "@/db/database";
import {
  ownLeavePageOf,
  readLeaveListParams,
} from "@/features/dorm/leave-address";
import { readLeaveBoard } from "@/features/dorm/leave-list";
import { leaveScreensOf } from "@/features/dorm/leave-screens";
import { type OwnLeave, readOwnLeave } from "@/features/dorm/own-leave";
import { residentHeader } from "@/features/dorm/resident-header";
import {
  ResidentLeavePart,
  ResidentLeaveScreen,
} from "@/features/dorm/resident-leave-screen";
import { StaffLeaveScreen } from "@/features/dorm/staff-leave-screen";
import type { SearchParams } from "@/ui/search-params";

/**
 * The student's own requests, on the page of "Riwayat izin saya" the
 * address asks for. Null for an account whose roles give no resident
 * part, or whose student lives in no dorm today.
 */
async function ownLeaveOf(
  account: Account,
  searchParams: SearchParams,
): Promise<OwnLeave | null> {
  if (!leaveScreensOf(account.roles).own) return null;
  const page = ownLeavePageOf(searchParams);
  const answer = await readOwnLeave(database(), account, page, new Date());
  if (answer.kind === "refused") return null;
  return answer.leave;
}

/**
 * The tab Perizinan asrama. Staff see the requests of the students they
 * may see through the roles that may see leave: Ketua Program Studi
 * those of their own program only. A student who lives in the dorm asks
 * for leave and sees their own requests. A resident who is also staff
 * sees the resident part above the staff screen.
 */
export default async function DormLeavePage(props: PageProps<"/asrama/izin">) {
  const opened = await openPage("asrama", "izin");
  const { account } = opened;
  const tabs = { pagePath: "asrama", tabs: opened.tabs, open: "izin" };
  const searchParams = await props.searchParams;
  const staffList = leaveScreensOf(account.roles).staff
    ? readLeaveListParams(searchParams)
    : null;
  const leave = await ownLeaveOf(account, searchParams);
  const part =
    leave === null
      ? null
      : {
          leave,
          newLeaveId: crypto.randomUUID(),
          newReportId: crypto.randomUUID(),
          staffList,
        };
  if (staffList !== null) {
    const visible = visibleTo(rowLimitForAction(account, "view_dorm_leave"));
    const board = await readLeaveBoard(
      database(),
      visible,
      staffList.filters,
      staffList.page,
      new Date(),
    );
    return (
      <StaffLeaveScreen
        tabs={tabs}
        params={staffList}
        board={board}
        rights={{
          decide: may(account.roles, "decide_dorm_leave"),
          verify: may(account.roles, "verify_dorm_return"),
          validate: may(account.roles, "validate_dorm_return"),
          record: may(account.roles, "record_dorm_return"),
        }}
        ownPart={part === null ? null : <ResidentLeavePart {...part} />}
        ownStudentId={account.studentId}
      />
    );
  }
  if (part === null) forbidden();
  return (
    <ResidentLeaveScreen
      tabs={tabs}
      room={await residentHeader(account.studentId)}
      {...part}
    />
  );
}
