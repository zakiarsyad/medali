import shared from "@/ui/data-screen.module.css";
import { groupCode } from "@/ui/group-code";
import { CHOSEN_GROUP_PARAM } from "./evaluation-address";
import { choicesByCohort, type EvaluationChoice } from "./evaluation-choices";
import styles from "./mentor-groups.module.css";
import { NO_MENTOR } from "./mentor-history";

/** A group as the choice names it: its code, then its mentor of today. */
function choiceWords(group: EvaluationChoice): string {
  return `${groupCode(group)} · ${group.mentorName ?? NO_MENTOR}`;
}

/** "Kelompok pengasuhan": the groups a form may be opened for, by angkatan. */
export function GroupChoice({
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
