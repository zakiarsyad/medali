import type { RowLimit } from "@/auth/access";
import { database } from "@/db/database";
import { statusAfter } from "./assignment-steps";
import styles from "./cohort-assignments.module.css";
import { DraftGroupsPanel } from "./draft-groups-panel";
import type { FormingStart } from "./forming-form";
import { FormingPanel } from "./forming-panel";
import { IntakePanel } from "./intake-panel";
import { intakeSummary } from "./intake-summary";
import { readMentorPool } from "./mentor-pool";
import { MentorStepPanel } from "./mentor-step-panel";
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

/** Step 3, with the mentors that may be chosen read for it. */
async function MentorStep({
  assignment,
  openGroupId,
}: {
  assignment: StoredAssignment;
  openGroupId: string | null;
}) {
  const pool = await readMentorPool(database(), assignment.cohortYear);
  return (
    <MentorStepPanel
      assignment={assignment}
      pool={pool}
      openGroupId={openGroupId}
    />
  );
}

/**
 * What the tab shows of the chosen angkatan. An account that prepares
 * gets the steps while the angkatan is not fixed, with the groups to
 * change in step 3. Any other is told who prepares, and sees the groups
 * that are saved to read only, as far as the limit lets the account see
 * them; so does everyone once the angkatan is fixed.
 */
export async function OpenCohort({
  cohortYear,
  limit,
  mayPrepare,
  openGroupId,
}: {
  cohortYear: number;
  limit: RowLimit;
  mayPrepare: boolean;
  /** The group whose members the address asks to show, if any. */
  openGroupId: string | null;
}) {
  const assignment = await readAssignment(database(), limit, cohortYear);
  const status = assignment?.status ?? null;
  const showsSteps = mayPrepare && statusAfter(status, "form") !== null;
  const formed = assignment && assignment.groups.length > 0 ? assignment : null;
  return (
    <>
      {showsSteps && (
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
      {formed && showsSteps && (
        <MentorStep assignment={formed} openGroupId={openGroupId} />
      )}
      {formed && !showsSteps && <DraftGroupsPanel assignment={formed} />}
    </>
  );
}
