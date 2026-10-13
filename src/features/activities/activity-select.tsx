import shared from "@/ui/data-screen.module.css";
import { type ActivityChoice, choicesBySemester } from "./activity-choice";
import { semesterGroupWords } from "./form-words";

/** Ties the words "Kegiatan dari Kurikulum" to the list they name. */
export const ACTIVITY_FIELD_ID = "schedule-activity";

/** "Kegiatan dari Kurikulum": the PPKS activities, grouped by semester. */
export function ActivitySelect({
  choices,
  chosenId,
  onChoose,
}: {
  choices: ActivityChoice[];
  /** The id of the chosen activity, or empty while none is chosen. */
  chosenId: string;
  onChoose: (activityId: string) => void;
}) {
  const groups = [...choicesBySemester(choices)];
  return (
    <select
      id={ACTIVITY_FIELD_ID}
      name="activity"
      className={shared.input}
      value={chosenId}
      onChange={(event) => onChoose(event.target.value)}
    >
      <option value="">Pilih kegiatan…</option>
      {groups.map(([semester, activities]) => (
        <optgroup key={semester} label={semesterGroupWords(semester)}>
          {activities.map((activity) => (
            <option key={activity.id} value={activity.id}>
              {activity.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
