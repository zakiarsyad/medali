import { MEDALI_VALUES, type ValueKey } from "@/ui/medali-values";
import { ValueSwatch } from "@/ui/value-swatch";
import styles from "./activities.module.css";

/** The MEDALI values an activity builds, each with its colour and name. */
export function ValueTags({ valueKeys }: { valueKeys: readonly ValueKey[] }) {
  const values = MEDALI_VALUES.filter((value) => valueKeys.includes(value.key));
  return (
    <>
      {values.map((value) => (
        <span key={value.key} className={styles.valueTag}>
          <ValueSwatch value={value.key} />
          {value.name}
        </span>
      ))}
    </>
  );
}
