import { campusDay } from "@/academic-periods/campus-day";
import type { RowLimit } from "@/auth/access";
import { database } from "@/db/database";
import { groupCode } from "@/ui/group-code";
import { readEvaluatedGroup } from "./evaluated-group";
import { evaluationAddress } from "./evaluation-address";
import { evaluationResult } from "./evaluation-result";
import { ChooseGroupFirst, MentorFacts } from "./group-facts";
import styles from "./mentor-groups.module.css";
import { ReplacementForm } from "./replacement-form";
import { spareChoices } from "./spare-choices";
import { listSpareMentors } from "./spare-mentors";

/** No period is asked for: the form of a replacement shows no stored evaluation. */
const NO_PERIODS: string[] = [];

/**
 * The form of a replacement under the choice of a group: who holds the
 * group, then the form. `limit` holds the groups the account may replace
 * the mentor of.
 */
export async function ReplacementPart({
  limit,
  chosenGroupId,
}: {
  limit: RowLimit;
  /** The group the address asks for, if any. */
  chosenGroupId: string | null;
}) {
  if (chosenGroupId === null) return <ChooseGroupFirst />;
  const db = database();
  const [group, spares] = await Promise.all([
    readEvaluatedGroup(db, limit, chosenGroupId, NO_PERIODS),
    listSpareMentors(db),
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
  return (
    <>
      <MentorFacts group={group} mentor={mentor} />
      {/* Made anew for each group, so its fields start from that group. */}
      <ReplacementForm
        key={group.id}
        group={{
          id: group.id,
          code: groupCode(group),
          members: group.members,
          oldMentorName: mentor.name,
          hasPoorEvaluation,
          evaluationAddress: evaluationAddress(group.id),
        }}
        choices={spareChoices(spares, mentor.unit)}
        today={campusDay()}
      />
    </>
  );
}
