import styles from "./fitness.module.css";
import { typedLimitsOf } from "./fitness-input";
import type { LimitsInForce } from "./fitness-limits";
import { LIMITS_READ_ONLY_NOTE, limitsNote } from "./fitness-words";
import { LimitsView } from "./limits-view";

/** "Ambang skor" for a role that only reads it: every field switched off, and who sets it. */
export function ReadOnlyLimits({ inForce }: { inForce: LimitsInForce }) {
  return (
    <LimitsView
      typed={typedLimitsOf(inForce.limits)}
      note={limitsNote(inForce.set)}
    >
      <p className={styles.note}>{LIMITS_READ_ONLY_NOTE}</p>
    </LimitsView>
  );
}
