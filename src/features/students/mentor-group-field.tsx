import shared from "@/ui/data-screen.module.css";
import {
  groupChoiceWords,
  NO_GROUP,
  NO_GROUP_WORDS,
} from "./group-choice-words";
import type { GroupChoice } from "./mentor-group-choices";
import styles from "./new-students.module.css";

const HINT_ID = "mentor-group-hint";

interface MentorGroupFieldProps {
  /** The groups of the angkatan, program studi and jalur chosen in the form. */
  groups: GroupChoice[];
  /** The id of the group the choice stands on, or empty for none. */
  chosen: string;
  /** The line under the choice. */
  hint: string;
  /** Shown under the line for a full group. Saving stays allowed. */
  warning: string | null;
  onChoose: (groupId: string) => void;
}

export function MentorGroupField({
  groups,
  chosen,
  hint,
  warning,
  onChoose,
}: MentorGroupFieldProps) {
  return (
    <div className={styles.groupField}>
      <label className={shared.field}>
        Kelompok pengasuhan
        <select
          name="mentorGroupId"
          className={shared.input}
          value={chosen}
          aria-describedby={HINT_ID}
          onChange={(event) => onChoose(event.target.value)}
        >
          <option value={NO_GROUP}>{NO_GROUP_WORDS}</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {groupChoiceWords(group)}
            </option>
          ))}
        </select>
      </label>
      <p id={HINT_ID} className={shared.detail} aria-live="polite">
        {hint}
      </p>
      {warning && (
        <p className={styles.groupWarning} role="status">
          {warning}
        </p>
      )}
    </div>
  );
}
