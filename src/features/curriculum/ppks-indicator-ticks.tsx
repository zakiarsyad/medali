import shared from "@/ui/data-screen.module.css";
import styles from "./curriculum.module.css";
import type { ValueIndicators } from "./main-indicators";
import { levelOf } from "./stages";

/** The main indicators of the chosen nilai, each to tick. */
export function PpksIndicatorTicks({
  values,
  semester,
  ticked,
  onToggle,
}: {
  /** Only the nilai that are chosen. */
  values: ValueIndicators[];
  semester: number;
  ticked: readonly string[];
  onToggle: (code: string) => void;
}) {
  if (values.length === 0) {
    return <p className={shared.detail}>Pilih nilai MEDALI terlebih dahulu.</p>;
  }
  return values.map((value) => (
    <div key={value.key}>
      <b className={styles.valueName}>{value.name}</b>
      {value.indicators.map(({ code, level, stage, text }) => (
        <label key={code} className={styles.tick}>
          <input
            type="checkbox"
            name="indicator"
            value={code}
            checked={ticked.includes(code)}
            onChange={() => onToggle(code)}
          />
          <span className={shared.badge}>{code}</span>
          <span className={styles.stage}>
            {stage}
            {level === levelOf(semester) && " (level semester ini)"}:
          </span>
          {text}
        </label>
      ))}
    </div>
  ));
}
