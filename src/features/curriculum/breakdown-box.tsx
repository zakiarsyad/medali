import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import { ValueSwatch } from "@/ui/value-swatch";
import styles from "./curriculum.module.css";
import { GradedScore } from "./grade-scale-panel";
import type { MainIndicator } from "./main-indicators";
import type { ValueBreakdown } from "./stage-breakdown";

export function BreakdownTitle({
  value,
  children,
}: {
  value: ValueBreakdown;
  children?: ReactNode;
}) {
  return (
    <h3 className={styles.boxTitle}>
      <ValueSwatch value={value.key} />
      {value.name}
      {children}
    </h3>
  );
}

/** What one nilai means at the chosen tahap, to read. */
export function BreakdownBox({
  value,
  indicators,
  score,
  children,
}: {
  value: ValueBreakdown;
  /** The main indicators chosen for the tahap, as they are now. */
  indicators: MainIndicator[];
  /** The average score of the nilai in the tahap, or null for none. */
  score: number | null;
  children?: ReactNode;
}) {
  return (
    <section className={styles.breakdown}>
      <BreakdownTitle value={value}>
        {score !== null && (
          <span className={styles.valueScore}>
            <GradedScore score={score} />
          </span>
        )}
      </BreakdownTitle>
      <p className={styles.breakdownText}>{value.text}</p>
      <span className={`${shared.label} ${styles.listLabel}`}>
        Kegiatan acuan
      </span>
      <ul className={styles.plainList}>
        {value.activities.map((activity) => (
          <li key={activity}>{activity}</li>
        ))}
      </ul>
      <div className={styles.stageIndicators}>
        <b>Indikator tahap</b>
        <ul className={styles.plainList}>
          {indicators.map(({ code, text }) => (
            <li key={code}>
              <span className={shared.badge}>{code}</span>
              {text}
            </li>
          ))}
        </ul>
      </div>
      {children}
    </section>
  );
}
