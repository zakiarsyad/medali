"use client";

import shared from "@/ui/data-screen.module.css";
import styles from "@/ui/file-upload.module.css";

/**
 * The switch between ways of putting records in, such as a form or an
 * uploaded file. `modes` holds each way with its label on screen.
 */
export function ModeSwitch<Mode extends string>({
  modes,
  mode,
  onChoose,
}: {
  modes: readonly (readonly [Mode, string])[];
  mode: Mode;
  onChoose: (mode: Mode) => void;
}) {
  return (
    <fieldset className={styles.modes}>
      <legend className={shared.hidden}>Cara input</legend>
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
