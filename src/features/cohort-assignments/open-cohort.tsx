import type { RowLimit } from "@/auth/access";
import { database } from "@/db/database";
import { statusAfter } from "./assignment-steps";
import styles from "./cohort-assignments.module.css";
import { DraftGroupsPanel } from "./draft-groups-panel";
import type { FormingStart } from "./forming-form";
import { FormingPanel } from "./forming-panel";
import { IntakePanel } from "./intake-panel";
import { intakeSummary } from "./intake-summary";
import { DEFAULT_METHOD } from "./methods";
import { readAssignment, type StoredAssignment } from "./stored-assignment";
import { DEFAULT_TARGET_SIZE } from "./target-size";
import { readWaitingStudents } from "./waiting-students";

function formingStart(assignment: StoredAssignment | null): FormingStart {
  if (assignment === null) {
    return {
      targetSize: DEFAULT_TARGET_SIZE,
      method: DEFAULT_METHOD,
      version: 0,
    };
  }
  const { targetSize, method, version } = assignment;
  return { targetSize, method, version };
}

/** Steps 1 and 2, for an account that prepares the penetapan. */
async function PrepareSteps({
  cohortYear,
  limit,
  assignment,
}: {
  cohortYear: number;
  limit: RowLimit;
  assignment: StoredAssignment | null;
}) {
  const waiting = await readWaitingStudents(database(), limit, cohortYear);
  return (
    <>
      <IntakePanel
        cohortYear={cohortYear}
        summary={intakeSummary(waiting)}
        status={assignment?.status ?? null}
      />
      <FormingPanel cohortYear={cohortYear} start={formingStart(assignment)} />
    </>
  );
}

/**
 * What the tab shows of the chosen angkatan. An account that prepares
 * gets the steps while the angkatan is not fixed; any other is told who
 * prepares. Both see the groups that are saved, as far as the limit lets
 * the account see them.
 */
export async function OpenCohort({
  cohortYear,
  limit,
  mayPrepare,
}: {
  cohortYear: number;
  limit: RowLimit;
  mayPrepare: boolean;
}) {
  const assignment = await readAssignment(database(), limit, cohortYear);
  const status = assignment?.status ?? null;
  const canBeFormed = statusAfter(status, "form") !== null;
  return (
    <>
      {mayPrepare && canBeFormed && (
        <PrepareSteps
          cohortYear={cohortYear}
          limit={limit}
          assignment={assignment}
        />
      )}
      {!mayPrepare && (
        <p className={styles.note}>
          Penetapan pengasuh dilakukan oleh Kepala Unit dan Pegawai UPK.
        </p>
      )}
      {assignment && assignment.groups.length > 0 && (
        <DraftGroupsPanel assignment={assignment} />
      )}
    </>
  );
}
