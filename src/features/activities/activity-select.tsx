import shared from "@/ui/data-screen.module.css";
import { type ActivityChoice, choicesBySemester } from "./activity-choice";
import { semesterGroupWords } from "./form-words";

/** Ties the words "Kegiatan dari Kurikulum" to the list they name. */
export const ACTIVITY_FIELD_ID = "schedule-activity";

function Options({ activities }: { activities: ActivityChoice[] }) {
  return activities.map((activity) => (
    <option key={activity.id} value={activity.id}>
      {activity.name}
    </option>
  ));
}

/**
 * "Kegiatan dari Kurikulum": the PPKS activities grouped by semester, or
 * the special and additional ones, which have none, in one list.
 */
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
      {groups.map(([semester, activities]) =>
        semester === null ? (
          <Options key="none" activities={activities} />
        ) : (
          <optgroup key={semester} label={semesterGroupWords(semester)}>
            <Options activities={activities} />
          </optgroup>
        ),
      )}
    </select>
  );
}
