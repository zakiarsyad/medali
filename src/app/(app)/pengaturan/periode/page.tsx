import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import {
  CLOSE_STEP_PARAM,
  CLOSED_PARAM,
} from "@/features/academic-periods/period-address";
import { PeriodsScreen } from "@/features/academic-periods/periods-screen";
import { firstParam } from "@/ui/search-params";

export default async function AcademicPeriodsPage(
  props: PageProps<"/pengaturan/periode">,
) {
  const opened = await openPage("pengaturan", "periode");
  const { roles } = opened.account;
  if (!may(roles, "set_academic_periods")) forbidden();
  const params = await props.searchParams;
  return (
    <PeriodsScreen
      tabs={{ pagePath: "pengaturan", tabs: opened.tabs, open: "periode" }}
      mayClose={may(roles, "close_semesters")}
      asked={{
        stepId: firstParam(params[CLOSE_STEP_PARAM]),
        closedId: firstParam(params[CLOSED_PARAM]),
      }}
    />
  );
}
