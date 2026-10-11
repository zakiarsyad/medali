import shared from "@/ui/data-screen.module.css";

interface SelectFieldProps {
  label: string;
  name: string;
  /** Each choice as the value sent and the words shown. */
  choices: readonly (readonly [value: string, shown: string])[];
  /** The choice the field starts on, and goes back to when the form is sent. */
  chosen: string;
  /** Given when another part of the form follows this choice. */
  onChoose?: (value: string) => void;
}

export function SelectField({
  label,
  name,
  choices,
  chosen,
  onChoose,
}: SelectFieldProps) {
  return (
    <label className={shared.field}>
      {label}
      <select
        name={name}
        className={shared.input}
        defaultValue={chosen}
        onChange={onChoose && ((event) => onChoose(event.target.value))}
      >
        {choices.map(([value, shown]) => (
          <option key={value} value={value}>
            {shown}
          </option>
        ))}
      </select>
    </label>
  );
}
