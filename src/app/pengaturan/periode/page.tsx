import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { PeriodsScreen } from "@/features/academic-periods/periods-screen";

export default async function AcademicPeriodsPage() {
  const opened = await openPage("pengaturan", "periode");
  if (!may(opened.account.roles, "set_academic_periods")) forbidden();
  return (
    <PeriodsScreen
      tabs={{ pagePath: "pengaturan", tabs: opened.tabs, open: "periode" }}
    />
  );
}
