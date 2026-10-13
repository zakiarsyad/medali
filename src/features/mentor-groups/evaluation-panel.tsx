import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { campusDay } from "@/academic-periods/campus-day";
import { periodTitle } from "@/academic-periods/period-labels";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import type { RowLimit } from "@/auth/access";
import { database } from "@/db/database";
import { groupCode } from "@/ui/group-code";
import { type EvaluatedGroup, readEvaluatedGroup } from "./evaluated-group";
import { EvaluationForm, type PeriodChoice } from "./evaluation-form";
import { evaluationPeriods, periodsHeldSince } from "./evaluation-periods";
import { ChooseGroupFirst, MentorFacts } from "./group-facts";
import styles from "./mentor-groups.module.css";

function ChosenGroup({
  group,
  offered,
}: {
  group: EvaluatedGroup;
  /** The periods offered today, the running one first. */
  offered: AcademicPeriod[];
}) {
  const { mentor } = group;
  if (mentor === null) {
    return (
      <p className={styles.facts}>
        {groupCode(group)} belum memiliki pengasuh, sehingga belum ada yang
        dievaluasi.
      </p>
    );
  }
  if (offered.length === 0) {
    return (
      <>
        <MentorFacts group={group} mentor={mentor} />
        <p className={styles.quiet}>
          Belum ada periode akademik yang berjalan, sehingga evaluasi belum bisa
          disimpan. Atur periode di Pengaturan, tab Periode akademik.
        </p>
      </>
    );
  }
  // Only the periods the mentor held the group in: the server refuses the rest.
  const periods = periodsHeldSince(offered, mentor.since).map(
    (period): PeriodChoice => ({ id: period.id, title: periodTitle(period) }),
  );
  if (periods.length === 0) {
    return (
      <>
        <MentorFacts group={group} mentor={mentor} />
        <p className={styles.quiet}>
          Pengasuh ini baru mulai mengasuh setelah periode yang dapat dievaluasi
          berakhir, sehingga belum ada periode untuk dievaluasi. Evaluasi dapat
          diisi pada periode akademik berikutnya.
        </p>
      </>
    );
  }
  return (
    <>
      <MentorFacts group={group} mentor={mentor} />
      {/* Made anew for each group, so its fields start from that group. */}
      <EvaluationForm
        key={group.id}
        groupId={group.id}
        periods={periods}
        stored={group.stored}
      />
    </>
  );
}

/**
 * The form of an evaluation under the choice of a group: who holds the
 * group, then the form. `limit` holds the groups the account may evaluate
 * the mentor of.
 */
export async function EvaluationPart({
  limit,
  chosenGroupId,
}: {
  limit: RowLimit;
  /** The group the address asks for, if any. */
  chosenGroupId: string | null;
}) {
  if (chosenGroupId === null) return <ChooseGroupFirst />;
  const db = database();
  const offered = evaluationPeriods(await readAcademicPeriods(db), campusDay());
  const group = await readEvaluatedGroup(
    db,
    limit,
    chosenGroupId,
    offered.map((period) => period.id),
  );
  if (group === null) return <ChooseGroupFirst />;
  return <ChosenGroup group={group} offered={offered} />;
}
