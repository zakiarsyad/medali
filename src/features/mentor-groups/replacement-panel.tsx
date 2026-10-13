import { campusDay } from "@/academic-periods/campus-day";
import type { RowLimit } from "@/auth/access";
import { database } from "@/db/database";
import shared from "@/ui/data-screen.module.css";
import { groupCode } from "@/ui/group-code";
import { readEvaluatedGroup } from "./evaluated-group";
import { evaluationAddress } from "./evaluation-address";
import { evaluationResult } from "./evaluation-result";
import { poorSaveWords } from "./evaluation-words";
import { ChooseGroupFirst, MentorFacts } from "./group-facts";
import styles from "./mentor-groups.module.css";
import { ReplacementForm } from "./replacement-form";
import { spareChoices } from "./spare-choices";
import { listSpareMentors } from "./spare-mentors";
import { readWaitingReplacementOf } from "./waiting-replacement-of";

/** No period is asked for unless the saving of an evaluation opened the form. */
const NO_PERIODS: string[] = [];

/**
 * The form of a replacement under the choice of a group: who holds the
 * group, then the form. `limit` holds the groups the account may replace
 * the mentor of.
 */
export async function ReplacementPart({
  limit,
  chosenGroupId,
  savedPeriodId,
}: {
  limit: RowLimit;
  /** The group the address asks for, if any. */
  chosenGroupId: string | null;
  /** The period of the evaluation whose saving opened the form, if any. */
  savedPeriodId: string | null;
}) {
  if (chosenGroupId === null) return <ChooseGroupFirst />;
  const db = database();
  const periods = savedPeriodId === null ? NO_PERIODS : [savedPeriodId];
  // Read together: the panel of the forms has found the group among those
  // the account may choose, and what is read for it is shown only with it.
  const [group, spares, waiting] = await Promise.all([
    readEvaluatedGroup(db, limit, chosenGroupId, periods),
    listSpareMentors(db),
    readWaitingReplacementOf(db, chosenGroupId),
  ]);
  if (group === null) return <ChooseGroupFirst />;
  const { mentor } = group;
  if (mentor === null) {
    return (
      <p className={styles.facts}>
        {groupCode(group)} belum memiliki pengasuh, sehingga belum ada yang
        diganti.
      </p>
    );
  }
  const hasPoorEvaluation =
    group.last !== null && evaluationResult(group.last) === "poor";
  const savedWords = poorSaveWords(mentor.name, group.stored);
  return (
    <>
      {savedWords !== null && (
        <p className={shared.done} role="status">
          {savedWords}
        </p>
      )}
      <MentorFacts group={group} mentor={mentor} />
      {/* Made anew for each group, so its fields start from that group. */}
      <ReplacementForm
        key={group.id}
        group={{
          id: group.id,
          code: groupCode(group),
          members: group.members,
          oldMentorId: mentor.id,
          oldMentorName: mentor.name,
          hasPoorEvaluation,
          evaluationAddress: evaluationAddress(group.id),
          waitingFrom: waiting?.startsOn ?? null,
        }}
        choices={spareChoices(spares, mentor.unit)}
        today={campusDay()}
      />
    </>
  );
}
