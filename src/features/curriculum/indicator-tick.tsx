import shared from "@/ui/data-screen.module.css";
import styles from "./curriculum.module.css";
import type { MainIndicator } from "./main-indicators";

/** One main indicator to tick in a form. */
export function IndicatorTick({
  indicator,
  levelNote,
  checked,
  onToggle,
}: {
  indicator: MainIndicator;
  /** What to say after the tahap when the level is the form's own. */
  levelNote: string;
  checked: boolean;
  onToggle: (code: string) => void;
}) {
  const { code, stage, text } = indicator;
  return (
    <label className={styles.tick}>
      <input
        type="checkbox"
        name="indicator"
        value={code}
        checked={checked}
        onChange={() => onToggle(code)}
      />
      <span className={shared.badge}>{code}</span>
      <span className={styles.stage}>
        {stage}
        {levelNote}:
      </span>
      {text}
    </label>
  );
}
