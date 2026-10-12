import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { readAskedCohort } from "@/features/cohort-assignments/assignment-address";
import { AssignmentScreen } from "@/features/cohort-assignments/assignment-screen";
import { STEP_ACTIONS } from "@/features/cohort-assignments/assignment-steps";
import { assignmentRowsFor } from "@/features/cohort-assignments/visible-assignments";

export default async function CohortAssignmentsPage(
  props: PageProps<"/pengasuh/tetap">,
) {
  const opened = await openPage("pengasuh", "tetap");
  const { account } = opened;
  const limit = assignmentRowsFor(account);
  if (limit === null) forbidden();
  return (
    <AssignmentScreen
      tabs={{ pagePath: "pengasuh", tabs: opened.tabs, open: "tetap" }}
      limit={limit}
      mayPrepare={may(account.roles, STEP_ACTIONS.form)}
      askedYear={readAskedCohort(await props.searchParams)}
    />
  );
}
