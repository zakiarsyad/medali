import {
  countWords,
  isHidden,
  type SetCountShown,
} from "@/health-notes/shown-count";
import styles from "./mental-health.module.css";
import { SCREENING_LEVELS, type ScreeningLevel } from "./screening-ids";
import { LEVEL_WORDS } from "./screening-words";

/** The colours of the prototype: fine, Sedang, and Berat or worse. */
const LEVEL_METERS: Record<ScreeningLevel, string | undefined> = {
  normal: styles.okMeter,
  mild: styles.okMeter,
  moderate: styles.warnMeter,
  severe: styles.badMeter,
  extremely_severe: styles.badMeter,
};

function barLength(count: SetCountShown): number {
  if (isHidden(count)) return 0;
  return count;
}

/**
 * One bar for each screening level, as long as its share of the largest.
 * A meter shows the share, so no width is written into the screen code.
 * A count sent hidden, as "<5" or "5+", says so and draws no bar.
 */
export function LevelBars({
  byLevel,
}: {
  byLevel: Record<ScreeningLevel, SetCountShown>;
}) {
  const largest = Math.max(1, ...Object.values(byLevel).map(barLength));
  return (
    <ul className={styles.levelBars}>
      {SCREENING_LEVELS.map((level) => (
        <li key={level} className={styles.levelBar}>
          <span className={styles.levelLabel}>{LEVEL_WORDS[level]}</span>
          <meter
            className={`${styles.levelMeter} ${LEVEL_METERS[level]}`}
            min={0}
            max={largest}
            value={barLength(byLevel[level])}
            aria-label={LEVEL_WORDS[level]}
          />
          <span className={styles.levelValue}>
            {countWords(byLevel[level])}
          </span>
        </li>
      ))}
    </ul>
  );
}
