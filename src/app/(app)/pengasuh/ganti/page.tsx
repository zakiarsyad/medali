import { forbidden } from "next/navigation";
import { openPage } from "@/auth/open-page";
import { readChosenGroup } from "@/features/mentor-groups/evaluation-address";
import { EvaluationScreen } from "@/features/mentor-groups/evaluation-screen";
import {
  evaluatedRowsFor,
  evaluationRowsFor,
} from "@/features/mentor-groups/visible-evaluations";

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
      evaluatedLimit={evaluatedRowsFor(account)}
      chosenGroupId={readChosenGroup(params)}
    />
  );
}
