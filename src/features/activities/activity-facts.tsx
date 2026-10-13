import shared from "@/ui/data-screen.module.css";
import { MEDALI_VALUES } from "@/ui/medali-values";
import { ValueSwatch } from "@/ui/value-swatch";
import styles from "./activities.module.css";
import type { ActivityChoice } from "./activity-choice";
import { activityTargetWords } from "./form-words";

/** What Kurikulum says of the chosen activity: nilai, indicators, target. */
export function ActivityFacts({ activity }: { activity: ActivityChoice }) {
  const values = MEDALI_VALUES.filter((value) =>
    activity.valueKeys.includes(value.key),
  );
  const target = activityTargetWords(activity.targetParticipants);
  return (
    <div className={`${styles.facts} ${styles.full}`}>
      {values.map((value) => (
        <span key={value.key} className={styles.valueTag}>
          <ValueSwatch value={value.key} />
          {value.name}
        </span>
      ))}
      <span>
        {activity.indicatorCodes.map((code) => (
          <span key={code} className={shared.badge}>
            {code}
          </span>
        ))}
      </span>
      {target !== "" && <span>{target}</span>}
    </div>
  );
}
