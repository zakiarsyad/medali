import { MEDALI_VALUES } from "./medali-values";
import { ValueSwatch } from "./value-swatch";
import styles from "./values-legend.module.css";

export function ValuesLegend() {
  return (
    <div className={styles.legend}>
      Nilai karakter MEDALI
      <ul className={styles.list}>
        {MEDALI_VALUES.map((value) => (
          <li key={value.key} className={styles.value}>
            <ValueSwatch value={value.key} />
            {value.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
