import { forbidden } from "next/navigation";
import { campusDay } from "@/academic-periods/campus-day";
import { may, rowLimitForAction } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { openPage } from "@/auth/open-page";
import { visibleTo } from "@/auth/visible-students";
import { database } from "@/db/database";
import { readAppealInbox } from "@/features/dorm/appeal-inbox";
import { AppealInboxPanel } from "@/features/dorm/appeal-inbox-panel";
import { readDisciplineProposals } from "@/features/dorm/discipline-proposals";
import {
  readOwnRecord,
  readOwnViolations,
} from "@/features/dorm/own-violations";
import {
  OwnRecord,
  OwnViolationsView,
} from "@/features/dorm/own-violations-view";
import { ProposalsPanel } from "@/features/dorm/proposals-panel";
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
import { readWarningProcess } from "@/features/dorm/warning-process";
import { WarningProcessDialog } from "@/features/dorm/warning-process-dialog";
import { penaltyFormAddress } from "@/features/guidance/penalty-address";
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
 * "Proses" of the resident the address names, for Pengelola Asrama only,
 * with the ticks "Kurangi". Null for any other account, for none named,
 * and for the account's own student, whose call another Pengelola Asrama
 * processes: the box then does not open. A resident no longer called
 * keeps the box, which says so, so the answer of a reduction that ended
 * the call stays in it.
 */
async function callProcessOf(
  account: Account,
  params: StaffViolationParams,
  now: Date,
) {
  const { callStudentId } = params;
  if (callStudentId === null) return null;
  if (callStudentId === account.studentId) return null;
  if (!may(account.roles, "issue_dorm_warning_letters")) return null;
  const process = await readWarningProcess(
    database(),
    visibleTo(rowLimitForAction(account, "issue_dorm_warning_letters")),
    callStudentId,
    now,
  );
  if (process === null) return null;
  return (
    <WarningProcessDialog
      process={process}
      params={params}
      now={now}
      reduces={may(account.roles, "reduce_dorm_violations")}
    />
  );
}

/**
 * "Pengajuan hukuman disiplin dari Pengelola Asrama" for Pengelola Asrama
 * and Kepala Unit, with "Proses" for Kepala Unit and "Catat hukuman
 * disiplin" for an account that records discipline penalties, which
 * opens Pembinaan on the student; null for any other account.
 */
async function proposalsOf(
  account: Account,
  params: StaffViolationParams,
  now: Date,
) {
  const proposals = await readDisciplineProposals(
    database(),
    account,
    params.proposalPage,
    now,
  );
  if (proposals === null) return null;
  return (
    <ProposalsPanel
      proposals={proposals}
      params={params}
      tools={{
        handles: may(account.roles, "handle_dorm_discipline_proposals"),
        ownStudentId: account.studentId,
        penaltyAddressOf: may(account.roles, "record_discipline_penalties")
          ? penaltyFormAddress
          : null,
      }}
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
    readStaffViolations(
      db,
      visible,
      params,
      now,
      may(account.roles, "view_dorm_warning_results"),
      may(account.roles, "view_dorm_violation_reductions"),
    ),
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
      proposals={await proposalsOf(account, params, now)}
      warnings={warnings}
      processes={may(account.roles, "issue_dorm_warning_letters")}
      ownStudentId={account.studentId}
      reduces={may(account.roles, "reduce_dorm_violations")}
      callProcess={await callProcessOf(account, params, now)}
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
