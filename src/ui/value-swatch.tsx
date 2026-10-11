import type { ValueKey } from "./medali-values";
import styles from "./value-swatch.module.css";

/** The small square in the colour of one MEDALI value. */
export function ValueSwatch({ value }: { value: ValueKey }) {
  return <i className={`${styles.swatch} ${styles[value]}`} />;
}
