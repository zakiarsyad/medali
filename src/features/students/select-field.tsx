import shared from "@/ui/data-screen.module.css";

interface SelectFieldProps {
  label: string;
  name: string;
  /** Each choice as the value sent and the words shown. */
  choices: readonly (readonly [value: string, shown: string])[];
  chosen: string;
  /**
   * Given when another part of the form follows this choice. The form
   * then holds the choice itself, so the two never disagree.
   */
  onChoose?: (value: string) => void;
}

export function SelectField({
  label,
  name,
  choices,
  chosen,
  onChoose,
}: SelectFieldProps) {
  const choice = onChoose
    ? {
        value: chosen,
        onChange: (event: { target: { value: string } }) =>
          onChoose(event.target.value),
      }
    : { defaultValue: chosen };
  return (
    <label className={shared.field}>
      {label}
      <select name={name} className={shared.input} {...choice}>
        {choices.map(([value, shown]) => (
          <option key={value} value={value}>
            {shown}
          </option>
        ))}
      </select>
    </label>
  );
}
