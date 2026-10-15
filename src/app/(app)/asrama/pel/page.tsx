import { forbidden } from "next/navigation";
import { campusDay } from "@/academic-periods/campus-day";
import { may, rowLimitForAction } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { openPage } from "@/auth/open-page";
import { visibleTo } from "@/auth/visible-students";
import { database } from "@/db/database";
import { readOwnViolations } from "@/features/dorm/own-violations";
import { OwnViolationsView } from "@/features/dorm/own-violations-view";
import { residentHeader } from "@/features/dorm/resident-header";
import { readStaffViolations } from "@/features/dorm/staff-violations";
import { StaffViolationsScreen } from "@/features/dorm/staff-violations-screen";
import {
  readOwnViolationParams,
  readStaffViolationParams,
} from "@/features/dorm/violation-address";
import { ViolationForm } from "@/features/dorm/violation-form";
import { readViolationSchedule } from "@/features/dorm/violation-schedule";
import type { SearchParams } from "@/ui/search-params";
import type { TabLinksProps } from "@/ui/tab-links";

/**
 * The staff screen: BAM records violations, schedules their announcement
 * and cancels one that waits; Pengelola Asrama and Kepala Unit read them.
 * Only those who record see what waits for its announcement.
 */
async function StaffScreen({
  account,
  tabs,
  searchParams,
  now,
}: {
  account: Account;
  tabs: TabLinksProps;
  searchParams: SearchParams;
  now: Date;
}) {
  const params = readStaffViolationParams(searchParams);
  const db = database();
  const board = await readStaffViolations(
    db,
    visibleTo(rowLimitForAction(account, "view_dorm_violations")),
    params,
    now,
  );
  const records = may(account.roles, "record_dorm_violations");
  const schedule = records
    ? await readViolationSchedule(
        db,
        visibleTo(rowLimitForAction(account, "record_dorm_violations")),
        now,
        params.schedulePage,
      )
    : null;
  const form = records ? (
    <ViolationForm
      newListId={crypto.randomUUID()}
      today={campusDay(now)}
      ownStudentId={account.studentId}
    />
  ) : null;
  return (
    <StaffViolationsScreen
      tabs={tabs}
      params={params}
      board={board}
      now={now}
      form={form}
      schedule={schedule}
    />
  );
}

/**
 * The tab Pelanggaran. Staff see every resident's violations; a student
 * who lives in the dorm sees their own and the announcement of their own
 * dorm, and no address can ask for another. The server's clock decides
 * what is announced.
 */
export default async function DormViolationsPage(
  props: PageProps<"/asrama/pel">,
) {
  const opened = await openPage("asrama", "pel");
  const { account } = opened;
  const tabs = { pagePath: "asrama", tabs: opened.tabs, open: "pel" };
  const searchParams = await props.searchParams;
  const now = new Date();
  if (may(account.roles, "view_dorm_violations")) {
    return (
      <StaffScreen
        account={account}
        tabs={tabs}
        searchParams={searchParams}
        now={now}
      />
    );
  }
  const params = readOwnViolationParams(searchParams);
  const own = await readOwnViolations(database(), account, params, now);
  if (own.kind === "refused") forbidden();
  return (
    <OwnViolationsView
      tabs={tabs}
      room={await residentHeader(account.studentId)}
      own={own}
      params={params}
      now={now}
    />
  );
}
