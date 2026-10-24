import styles from "./counted-select.module.css";
import shared from "./data-screen.module.css";

export interface CountedChoice {
  value: string;
  shown: string;
  /** How many students the choice holds. */
  held: number;
}

/**
 * A list of choices that each say how many students they hold. A choice
 * that holds none is left out, unless it is the one chosen.
 */
export function CountedSelect({
  label,
  name,
  every,
  choices,
  chosen,
}: {
  label: string;
  name: string;
  /** The words of the first choice, which holds every student. */
  every: string;
  choices: CountedChoice[];
  /** The value chosen, or empty for every student. */
  chosen: string;
}) {
  const offered = choices.filter(
    (choice) => choice.held > 0 || choice.value === chosen,
  );
  return (
    <label className={`${shared.field} ${styles.counted}`}>
      {label}
      <select
        name={name}
        className={chosen ? `${shared.input} ${styles.chosen}` : shared.input}
        defaultValue={chosen}
      >
        <option value="">{every}</option>
        {offered.map(({ value, shown, held }) => (
          <option key={value} value={value}>
            {shown} ({held.toLocaleString("id-ID")})
          </option>
        ))}
      </select>
    </label>
  );
}
