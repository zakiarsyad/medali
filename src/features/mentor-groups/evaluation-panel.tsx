import { campusDay } from "@/academic-periods/campus-day";
import { periodTitle } from "@/academic-periods/period-labels";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import type { RowLimit } from "@/auth/access";
import { database } from "@/db/database";
import { AutoSubmitForm } from "@/ui/auto-submit-form";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { groupCode } from "@/ui/group-code";
import { mentorLabel } from "@/ui/mentor-label";
import { type EvaluatedGroup, readEvaluatedGroup } from "./evaluated-group";
import { CHOSEN_GROUP_PARAM, EVALUATION_ADDRESS } from "./evaluation-address";
import { EvaluationBadge } from "./evaluation-badge";
import {
  choicesByCohort,
  type EvaluationChoice,
  listEvaluationChoices,
} from "./evaluation-choices";
import { EvaluationForm, type PeriodChoice } from "./evaluation-form";
import { evaluationPeriods } from "./evaluation-periods";
import { FAIR_FROM } from "./evaluation-result";
import styles from "./mentor-groups.module.css";
import { NO_MENTOR } from "./mentor-history";

/** A group as the choice names it: its code, then its mentor of today. */
function choiceWords(group: EvaluationChoice): string {
  return `${groupCode(group)} · ${group.mentorName ?? NO_MENTOR}`;
}

function GroupChoice({
  choices,
  chosenId,
}: {
  choices: EvaluationChoice[];
  chosenId: string | null;
}) {
  return (
    <label className={shared.field}>
      Kelompok pengasuhan
      <select
        name={CHOSEN_GROUP_PARAM}
        className={`${shared.input} ${styles.fit}`}
        defaultValue={chosenId ?? ""}
      >
        <option value="">Pilih kelompok pengasuhan</option>
        {choicesByCohort(choices).map((cohort) => (
          <optgroup
            key={cohort.cohortYear}
            label={`Angkatan ${cohort.cohortYear}`}
          >
            {cohort.groups.map((group) => (
              <option key={group.id} value={group.id}>
                {choiceWords(group)}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

/** The box above the form: who holds the group, since when, and how large it is. */
function GroupFacts({ group }: { group: EvaluatedGroup }) {
  if (group.mentor === null) {
    return (
      <p className={styles.facts}>
        {groupCode(group)} belum memiliki pengasuh, sehingga belum ada yang
        dievaluasi.
      </p>
    );
  }
  return (
    <p className={styles.facts}>
      <b>{mentorLabel(group.mentor)}</b> mengasuh {groupCode(group)} sejak{" "}
      {shownDay(group.mentor.since)}. {group.members.toLocaleString("id-ID")}{" "}
      mahasiswa aktif. Evaluasi terakhir:{" "}
      <EvaluationBadge scores={group.last} />
    </p>
  );
}

function ChosenGroup({
  group,
  periods,
}: {
  group: EvaluatedGroup;
  periods: PeriodChoice[];
}) {
  if (group.mentor === null) return <GroupFacts group={group} />;
  if (periods.length === 0) {
    return (
      <>
        <GroupFacts group={group} />
        <p className={styles.quiet}>
          Belum ada periode akademik yang berjalan, sehingga evaluasi belum bisa
          disimpan. Atur periode di Pengaturan, tab Periode akademik.
        </p>
      </>
    );
  }
  return (
    <>
      <GroupFacts group={group} />
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
 * "Evaluasi pengasuh": the choice of a group, then who holds it and the
 * form. Only for an account that may evaluate; `limit` holds the groups
 * it may evaluate the mentor of.
 */
export async function EvaluationPanel({
  limit,
  chosenGroupId,
}: {
  limit: RowLimit;
  /** The group the address asks for, if any. */
  chosenGroupId: string | null;
}) {
  const db = database();
  const [choices, stored] = await Promise.all([
    listEvaluationChoices(db, limit),
    readAcademicPeriods(db),
  ]);
  const offered = evaluationPeriods(stored, campusDay());
  const group =
    chosenGroupId === null
      ? null
      : await readEvaluatedGroup(
          db,
          limit,
          chosenGroupId,
          offered.map((period) => period.id),
        );
  const periods = offered.map((period) => ({
    id: period.id,
    title: periodTitle(period),
  }));
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Evaluasi pengasuh</h2>
      <p className={styles.quiet}>
        Kepala UPK menilai pengasuh setiap periode. Hasil kurang (di bawah{" "}
        {FAIR_FROM}) menjadi dasar penggantian.
      </p>
      {/* Made anew for each address, so the choice shows what the address holds. */}
      <AutoSubmitForm key={group?.id ?? ""} action={EVALUATION_ADDRESS}>
        <GroupChoice choices={choices} chosenId={group?.id ?? null} />
      </AutoSubmitForm>
      {group === null ? (
        <p className={styles.quiet}>
          Pilih kelompok untuk melihat pengasuh saat ini dan indikator
          kinerjanya.
        </p>
      ) : (
        <ChosenGroup group={group} periods={periods} />
      )}
    </section>
  );
}
