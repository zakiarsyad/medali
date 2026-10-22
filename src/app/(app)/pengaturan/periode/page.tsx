import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { PeriodsScreen } from "@/features/academic-periods/periods-screen";

export default async function AcademicPeriodsPage() {
  const opened = await openPage("pengaturan", "periode");
  const { roles } = opened.account;
  if (!may(roles, "set_academic_periods")) forbidden();
  return (
    <PeriodsScreen
      tabs={{ pagePath: "pengaturan", tabs: opened.tabs, open: "periode" }}
      mayClose={may(roles, "close_semesters")}
    />
  );
}
