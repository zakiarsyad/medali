import type { RowLimit } from "@/auth/access";
import { database } from "@/db/database";
import { statusAfter } from "./assignment-steps";
import { CancelButton } from "./cancel-button";
import styles from "./cohort-assignments.module.css";
import { checkOfGroups, type DraftCheck } from "./draft-check";
import { DraftGroupsPanel } from "./draft-groups-panel";
import { droppedWords } from "./dropped-members";
import { FixingPanel } from "./fixing-panel";
import type { FormingStart } from "./forming-form";
import { FormingPanel } from "./forming-panel";
import { IntakePanel } from "./intake-panel";
import { intakeSummary } from "./intake-summary";
import { readMentorPool } from "./mentor-pool";
import { MentorStepPanel } from "./mentor-step-panel";
import { DEFAULT_METHOD } from "./methods";
import { OneSaveAtATime } from "./one-save";
import { ProcessLog } from "./process-log";
import { readAssignment, type StoredAssignment } from "./stored-assignment";
import { DEFAULT_TARGET_SIZE } from "./target-size";
import { readWaitingStudents, type WaitingStudent } from "./waiting-students";

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
function PrepareSteps({
  cohortYear,
  waiting,
  assignment,
}: {
  cohortYear: number;
  waiting: WaitingStudent[];
  assignment: StoredAssignment | null;
}) {
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
  check,
  openGroupId,
}: {
  assignment: StoredAssignment;
  check: DraftCheck;
  openGroupId: string | null;
}) {
  const pool = await readMentorPool(database(), assignment.cohortYear);
  return (
    <MentorStepPanel
      assignment={assignment}
      check={check}
      pool={pool}
      openGroupId={openGroupId}
    />
  );
}

/**
 * The groups to read only. "Riwayat proses" names the staff who prepared
 * the penetapan, and "Anggota" names the members of a group, so only an
 * account that prepares one sees them. A fixed one has "Batalkan
 * penetapan" for an account that may fix.
 */
function SavedGroups({
  assignment,
  mayPrepare,
  mayFix,
  openGroupId,
}: {
  assignment: StoredAssignment;
  mayPrepare: boolean;
  mayFix: boolean;
  openGroupId: string | null;
}) {
  const { cohortYear, version, status } = assignment;
  const mayCancel = mayFix && statusAfter(status, "cancel") !== null;
  return (
    <DraftGroupsPanel
      assignment={assignment}
      openGroupId={mayPrepare ? openGroupId : undefined}
      action={
        mayCancel ? <CancelButton shown={{ cohortYear, version }} /> : undefined
      }
    >
      {mayPrepare && <ProcessLog log={assignment.log} />}
    </DraftGroupsPanel>
  );
}

/** Steps 3 and 4, with a note when students left the draft. */
function DraftSteps({
  assignment,
  waiting,
  mayFix,
  openGroupId,
}: {
  assignment: StoredAssignment;
  waiting: WaitingStudent[];
  mayFix: boolean;
  openGroupId: string | null;
}) {
  const check = checkOfGroups(assignment.groups, waiting);
  return (
    <>
      {assignment.dropped > 0 && (
        <p className={`${styles.note} ${styles.held}`} role="status">
          {droppedWords(assignment.dropped)}
        </p>
      )}
      <MentorStep
        assignment={assignment}
        check={check}
        openGroupId={openGroupId}
      />
      <FixingPanel
        assignment={assignment}
        isComplete={check.isComplete}
        mayFix={mayFix}
      />
    </>
  );
}

/**
 * What the tab shows of the chosen angkatan. An account that prepares
 * gets the steps while the angkatan is not fixed, with the groups to
 * change in step 3 and the penetapan in step 4, and a note when students
 * left the draft. Any other is told who
 * prepares, and sees the groups that are saved to read only, as far as
 * the limit lets the account see them; so does everyone once the
 * angkatan is fixed, and then an account that prepares has "Anggota" to
 * read the members of a group. "Riwayat proses" is read only for an
 * account that prepares, the only one it is shown to.
 */
export async function OpenCohort({
  cohortYear,
  limit,
  mayPrepare,
  mayFix,
  openGroupId,
}: {
  cohortYear: number;
  limit: RowLimit;
  mayPrepare: boolean;
  /** Whether the account may fix the penetapan, or only submits it. */
  mayFix: boolean;
  /** The group whose members the address asks to show, if any. */
  openGroupId: string | null;
}) {
  const db = database();
  const assignment = await readAssignment(db, limit, cohortYear, mayPrepare);
  const status = assignment?.status ?? null;
  const showsSteps = mayPrepare && statusAfter(status, "form") !== null;
  const waiting = showsSteps
    ? await readWaitingStudents(db, limit, cohortYear)
    : [];
  const formed = assignment && assignment.groups.length > 0 ? assignment : null;
  return (
    // Made anew for each angkatan, so nothing said of one shows on another.
    <OneSaveAtATime key={cohortYear}>
      {showsSteps && (
        <PrepareSteps
          cohortYear={cohortYear}
          waiting={waiting}
          assignment={assignment}
        />
      )}
      {!mayPrepare && (
        <p className={styles.note}>
          Penetapan pengasuh dilakukan oleh Kepala Unit dan Pegawai UPK.
        </p>
      )}
      {formed && showsSteps && (
        <DraftSteps
          assignment={formed}
          waiting={waiting}
          mayFix={mayFix}
          openGroupId={openGroupId}
        />
      )}
      {formed && !showsSteps && (
        <SavedGroups
          assignment={formed}
          mayPrepare={mayPrepare}
          mayFix={mayFix}
          openGroupId={openGroupId}
        />
      )}
    </OneSaveAtATime>
  );
}
