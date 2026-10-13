import shared from "@/ui/data-screen.module.css";
import styles from "./curriculum.module.css";
import { IndicatorTick } from "./indicator-tick";
import type { ValueIndicators } from "./main-indicators";
import { levelNote } from "./ppks-activities";

/** The main indicators of the chosen nilai, each to tick. */
export function PpksIndicatorTicks({
  values,
  semester,
  ticked,
  onToggle,
}: {
  /** Only the nilai that are chosen. */
  values: ValueIndicators[];
  /** Null in the form of a special or additional activity. */
  semester: number | null;
  ticked: readonly string[];
  onToggle: (code: string) => void;
}) {
  if (values.length === 0) {
    return <p className={shared.detail}>Pilih nilai MEDALI terlebih dahulu.</p>;
  }
  return values.map((value) => (
    <div key={value.key}>
      <b className={styles.valueName}>{value.name}</b>
      {value.indicators.map((indicator) => (
        <IndicatorTick
          key={indicator.code}
          indicator={indicator}
          levelNote={levelNote(indicator.level, semester)}
          checked={ticked.includes(indicator.code)}
          onToggle={onToggle}
        />
      ))}
    </div>
  ));
}
