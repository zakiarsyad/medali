import { campusDay } from "@/academic-periods/campus-day";
import { may, rowLimitForAction } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { visibleTo } from "@/auth/visible-students";
import { database } from "@/db/database";
import { residentHeader } from "@/features/dorm/resident-header";
import { StaffViolationsScreen } from "@/features/dorm/staff-violations-screen";
import { readStaffViolationParams } from "@/features/dorm/violation-address";
import { ViolationForm } from "@/features/dorm/violation-form";
import { readViolationSchedule } from "@/features/dorm/violation-schedule";
import { EmptyPage } from "@/ui/empty-page";

/**
 * The tab Pelanggaran. BAM records violations, schedules their
 * announcement and cancels one that waits; Pengelola Asrama and Kepala
 * Unit read them. Only those who record see what waits for its
 * announcement.
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
  if (!may(account.roles, "record_dorm_violations")) {
    return (
      <StaffViolationsScreen
        tabs={tabs}
        params={params}
        form={null}
        schedule={null}
      />
    );
  }
  const visible = visibleTo(
    rowLimitForAction(account, "record_dorm_violations"),
  );
  const schedule = await readViolationSchedule(
    database(),
    visible,
    new Date(),
    params.schedulePage,
  );
  return (
    <StaffViolationsScreen
      tabs={tabs}
      params={params}
      form={
        <ViolationForm
          newListId={crypto.randomUUID()}
          today={campusDay()}
          ownStudentId={account.studentId}
        />
      }
      schedule={schedule}
    />
  );
}
