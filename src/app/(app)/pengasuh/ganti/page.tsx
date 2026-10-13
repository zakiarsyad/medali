import { forbidden } from "next/navigation";
import { openPage } from "@/auth/open-page";
import {
  readChosenGroup,
  readChosenPart,
} from "@/features/mentor-groups/evaluation-address";
import { EvaluationScreen } from "@/features/mentor-groups/evaluation-screen";
import {
  evaluatedRowsFor,
  evaluationRowsFor,
} from "@/features/mentor-groups/visible-evaluations";
import { replacedRowsFor } from "@/features/mentor-groups/visible-replacements";

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
      formLimits={{
        evaluation: evaluatedRowsFor(account),
        replacement: replacedRowsFor(account),
      }}
      chosenPart={readChosenPart(params)}
      chosenGroupId={readChosenGroup(params)}
    />
  );
}
