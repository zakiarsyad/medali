import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { residentHeader } from "@/features/dorm/resident-header";
import { StaffViolationsScreen } from "@/features/dorm/staff-violations-screen";
import { ViolationForm } from "@/features/dorm/violation-form";
import { EmptyPage } from "@/ui/empty-page";

/**
 * The tab Pelanggaran. BAM records violations and schedules their
 * announcement; Pengelola Asrama and Kepala Unit read them.
 */
export default async function DormViolationsPage() {
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
  const form = may(account.roles, "record_dorm_violations") ? (
    <ViolationForm
      newListId={crypto.randomUUID()}
      today={campusDay()}
      ownStudentId={account.studentId}
    />
  ) : null;
  return <StaffViolationsScreen tabs={tabs} form={form} />;
}
