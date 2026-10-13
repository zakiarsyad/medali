import { forbidden } from "next/navigation";
import { openPage } from "@/auth/open-page";
import {
  readChosenGroup,
  readChosenPart,
  readSavedPeriod,
} from "@/features/mentor-groups/evaluation-address";
import { EvaluationScreen } from "@/features/mentor-groups/evaluation-screen";
import { formLimitsFor } from "@/features/mentor-groups/form-parts";
import { evaluationRowsFor } from "@/features/mentor-groups/visible-evaluations";
import { groupRowsFor } from "@/features/mentor-groups/visible-groups";

export default async function MentorEvaluationsPage(
  props: PageProps<"/pengasuh/ganti">,
) {
  const opened = await openPage("pengasuh", "ganti");
  const { account } = opened;
  const limit = evaluationRowsFor(account);
  if (limit === null) forbidden();
  const params = await props.searchParams;
  return (
    <EvaluationScreen
      tabs={{ pagePath: "pengasuh", tabs: opened.tabs, open: "ganti" }}
      limit={limit}
      groupLimit={groupRowsFor(account)}
      formLimits={formLimitsFor(account)}
      chosenPart={readChosenPart(params)}
      chosenGroupId={readChosenGroup(params)}
      savedPeriodId={readSavedPeriod(params)}
    />
  );
}
