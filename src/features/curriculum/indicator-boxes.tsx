import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import { ValueSwatch } from "@/ui/value-swatch";
import styles from "./curriculum.module.css";
import type { ValueIndicators } from "./main-indicators";

export function ValueBox({
  value,
  children,
}: {
  value: ValueIndicators;
  children: ReactNode;
}) {
  return (
    <section className={styles.box}>
      <h3 className={styles.boxTitle}>
        <ValueSwatch value={value.key} />
        {value.name}
      </h3>
      {children}
    </section>
  );
}

/**
 * One box per MEDALI value, with its four indicators to read. The one of
 * the chosen tahap is marked.
 */
export function IndicatorBoxes({
  values,
  level,
}: {
  values: ValueIndicators[];
  /** The level of the chosen tahap. */
  level: number;
}) {
  return (
    <div className={styles.boxes}>
      {values.map((value) => (
        <ValueBox key={value.key} value={value}>
          <ol className={styles.indicators}>
            {value.indicators.map((indicator) => (
              <li
                key={indicator.code}
                className={styles.indicator}
                aria-current={indicator.level === level || undefined}
              >
                <span className={shared.badge}>{indicator.code}</span>
                <span>
                  <span className={styles.level}>
                    Level {indicator.level} · {indicator.stage}
                  </span>
                  {indicator.text}
                </span>
              </li>
            ))}
          </ol>
        </ValueBox>
      ))}
    </div>
  );
}
