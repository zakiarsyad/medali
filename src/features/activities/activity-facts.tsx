import shared from "@/ui/data-screen.module.css";
import styles from "./activities.module.css";
import type { ActivityChoice } from "./activity-choice";
import { activityTargetWords } from "./form-words";
import { ValueTags } from "./value-tags";

/** What Kurikulum says of the chosen activity: nilai, indicators, target. */
export function ActivityFacts({ activity }: { activity: ActivityChoice }) {
  const target = activityTargetWords(activity.targetParticipants);
  return (
    <div className={`${styles.facts} ${styles.full}`}>
      <ValueTags valueKeys={activity.valueKeys} />
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
