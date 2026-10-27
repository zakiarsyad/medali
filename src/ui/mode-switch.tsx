"use client";

import shared from "@/ui/data-screen.module.css";
import styles from "@/ui/file-upload.module.css";

/**
 * A row of buttons where one of a few choices is picked, such as a form or
 * an uploaded file. `modes` holds each choice with its label on screen.
 */
export function ModeSwitch<Mode extends string>({
  legend,
  modes,
  mode,
  onChoose,
}: {
  /** What the row chooses, heard by a screen reader: "Cara input". */
  legend: string;
  modes: readonly (readonly [Mode, string])[];
  mode: Mode;
  onChoose: (mode: Mode) => void;
}) {
  return (
    <fieldset className={styles.modes}>
      <legend className={shared.hidden}>{legend}</legend>
      {modes.map(([value, label]) => (
        <button
          key={value}
          type="button"
          className={
            value === mode ? `${styles.mode} ${styles.modeOn}` : styles.mode
          }
          aria-pressed={value === mode}
          onClick={() => onChoose(value)}
        >
          {label}
        </button>
      ))}
    </fieldset>
  );
}
