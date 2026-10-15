import { forbidden } from "next/navigation";
import { campusDay } from "@/academic-periods/campus-day";
import { may, rowLimitForAction } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { openPage } from "@/auth/open-page";
import { visibleTo } from "@/auth/visible-students";
import { database } from "@/db/database";
import { readAppealInbox } from "@/features/dorm/appeal-inbox";
import { AppealInboxPanel } from "@/features/dorm/appeal-inbox-panel";
import {
  readOwnRecord,
  readOwnViolations,
} from "@/features/dorm/own-violations";
import {
  OwnRecord,
  OwnViolationsView,
} from "@/features/dorm/own-violations-view";
import { residentHeader } from "@/features/dorm/resident-header";
import { readStaffViolations } from "@/features/dorm/staff-violations";
import { StaffViolationsScreen } from "@/features/dorm/staff-violations-screen";
import {
  readOwnViolationParams,
  readStaffViolationParams,
  type StaffViolationParams,
  staffViolationsAddress,
} from "@/features/dorm/violation-address";
import { ViolationForm } from "@/features/dorm/violation-form";
import { readViolationSchedule } from "@/features/dorm/violation-schedule";
import { violationScreensOf } from "@/features/dorm/violation-screens";
import { readWarningCalls } from "@/features/dorm/warning-calls";
import type { SearchParams } from "@/ui/search-params";
import type { TabLinksProps } from "@/ui/tab-links";

/**
 * The own record of a resident who is also staff, below the staff
 * panels: their own violations only, with "Ajukan advokasi". Null for an
 * account whose roles give no own record, or whose student lives in no
 * dorm today.
 */
async function ownRecordOf(
  account: Account,
  params: StaffViolationParams,
  now: Date,
) {
  if (!violationScreensOf(account.roles).own) return null;
  const own = await readOwnRecord(
    database(),
    account,
    { periodId: params.ownPeriodId, page: params.ownPage },
    now,
  );
  if (own.kind === "refused") return null;
  const beside = staffViolationsAddress({
    ...params,
    ownPeriodId: null,
    ownPage: 1,
  });
  return (
    <OwnRecord
      own={own}
      now={now}
      title="Pelanggaran saya"
      keep={[...new URL(beside, "http://medali").searchParams.entries()]}
      addressOfPage={(page) =>
        staffViolationsAddress({ ...params, ownPage: page })
      }
    />
  );
}

/**
 * The staff screen: BAM records violations, schedules their announcement
 * and cancels one that waits; Pengelola Asrama and Kepala Unit read them.
 * Only those who record see what waits for its announcement, and only
 * BAM - BPHK and BAM - KI see the appeals that wait, with their reasons.
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
  const visible = visibleTo(rowLimitForAction(account, "view_dorm_violations"));
  const [board, warnings] = await Promise.all([
    readStaffViolations(db, visible, params, now),
    readWarningCalls(db, visible, now, params.callPage),
  ]);
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
  const decides = may(account.roles, "decide_dorm_violation_appeals");
  const inbox = decides
    ? await readAppealInbox(
        db,
        visibleTo(rowLimitForAction(account, "decide_dorm_violation_appeals")),
        params.appealPage,
      )
    : null;
  const appeals =
    inbox === null ? null : (
      <AppealInboxPanel
        inbox={inbox}
        params={params}
        ownStudentId={account.studentId}
      />
    );
  return (
    <StaffViolationsScreen
      tabs={tabs}
      params={params}
      board={board}
      now={now}
      form={form}
      schedule={schedule}
      appeals={appeals}
      waitingAppeals={inbox?.waiting ?? null}
      warnings={warnings}
      ownRecord={await ownRecordOf(account, params, now)}
    />
  );
}

/**
 * The tab Pelanggaran. Staff see every resident's violations; a student
 * who lives in the dorm sees their own and the announcement of their own
 * dorm, and no address can ask for another. A resident who is also staff
 * sees the staff screen with their own record below it. The server's clock decides
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
  if (violationScreensOf(account.roles).staff) {
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
