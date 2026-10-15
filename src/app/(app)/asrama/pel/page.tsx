import { campusDay } from "@/academic-periods/campus-day";
import { may, rowLimitForAction } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { visibleTo } from "@/auth/visible-students";
import { database } from "@/db/database";
import { residentHeader } from "@/features/dorm/resident-header";
import { readStaffViolations } from "@/features/dorm/staff-violations";
import { StaffViolationsScreen } from "@/features/dorm/staff-violations-screen";
import { readStaffViolationParams } from "@/features/dorm/violation-address";
import { ViolationForm } from "@/features/dorm/violation-form";
import { readViolationSchedule } from "@/features/dorm/violation-schedule";
import { EmptyPage } from "@/ui/empty-page";

/**
 * The tab Pelanggaran. BAM records violations, schedules their
 * announcement and cancels one that waits; Pengelola Asrama and Kepala
 * Unit read them. Only those who record see what waits for its
 * announcement. The server's clock decides what is announced.
 */
export default async function DormViolationsPage(
  props: PageProps<"/asrama/pel">,
) {
  const opened = await openPage("asrama", "pel");
  const { account } = opened;
  const tabs = { pagePath: "asrama", tabs: opened.tabs, open: "pel" };
  if (!may(account.roles, "view_dorm_violations")) {
    return (
      <EmptyPage
        title="Pelanggaran"
        lede={await residentHeader(account.studentId)}
        tabs={tabs}
      />
    );
  }
  const params = readStaffViolationParams(await props.searchParams);
  const now = new Date();
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
