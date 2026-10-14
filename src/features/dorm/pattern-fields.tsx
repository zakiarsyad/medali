import { useState } from "react";
import shared from "@/ui/data-screen.module.css";
import styles from "./activities.module.css";
import {
  LAST_MONTH_DAY,
  ROUTINE_PATTERNS,
  type RoutinePattern,
} from "./activity-ids";
import { PATTERN_WORDS, WEEKDAY_WORDS } from "./activity-words";
import { DaysOffField } from "./days-off-field";
import type { FormStart } from "./form-start";

function isPattern(chosen: string): chosen is RoutinePattern {
  return ROUTINE_PATTERNS.some((pattern) => pattern === chosen);
}

function Weekdays({ start }: { start: number[] }) {
  return (
    <fieldset className={`${styles.full} ${styles.group}`}>
      <legend className={shared.label}>Hari</legend>
      <div className={shared.roles}>
        {WEEKDAY_WORDS.map((words, weekday) => (
          <label key={words} className={shared.role}>
            <input
              type="checkbox"
              name="weekdays"
              value={weekday}
              defaultChecked={start.includes(weekday)}
            />
            {words}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * The fields of a repeating activity: Pola pengulangan with the days of
 * the week of a weekly one or the date of a monthly one, Berlaku mulai
 * and sampai, and the days without the activity.
 */
export function PatternFields({ start }: { start: FormStart }) {
  const [pattern, setPattern] = useState<RoutinePattern>(start.pattern);
  return (
    <>
      <label className={shared.field}>
        Pola pengulangan
        <select
          name="pattern"
          className={shared.input}
          value={pattern}
          onChange={(event) => {
            if (isPattern(event.target.value)) setPattern(event.target.value);
          }}
        >
          {ROUTINE_PATTERNS.map((each) => (
            <option key={each} value={each}>
              {PATTERN_WORDS[each]}
            </option>
          ))}
        </select>
      </label>
      {pattern === "weekly" && <Weekdays start={start.weekdays} />}
      {pattern === "monthly" && (
        <label className={shared.field}>
          Tanggal setiap bulan
          <input
            name="monthDay"
            type="number"
            min={1}
            max={LAST_MONTH_DAY}
            className={shared.input}
            defaultValue={start.monthDay}
          />
        </label>
      )}
      <label className={shared.field}>
        Berlaku mulai
        <input
          name="startsOn"
          type="date"
          className={shared.input}
          defaultValue={start.startsOn}
        />
      </label>
      <label className={shared.field}>
        Berlaku sampai (opsional)
        <input
          name="endsOn"
          type="date"
          className={shared.input}
          defaultValue={start.endsOn}
        />
      </label>
      <DaysOffField start={start.daysOff} />
    </>
  );
}
