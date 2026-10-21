import { CATEGORY_WORDS, rangeWords } from "./category-words";
import { categoryRange } from "./fitness-category";
import {
  FITNESS_CATEGORIES,
  type FitnessCategory,
  type FitnessLimits,
} from "./fitness-ids";
import styles from "./health-notes.module.css";
import { type CountShown, countWords } from "./shown-count";

function barLength(count: CountShown): number {
  if (count === "<5") return 0;
  return count;
}

/**
 * One bar for each category, with its scores in brackets, as long as
 * its share of the largest, as the prototype draws them. A meter shows
 * the share, so no width is written into the screen code. A count sent
 * as "<5" says so and draws no bar.
 */
export function CategoryBars({
  counts,
  limits,
}: {
  counts: Record<FitnessCategory, CountShown>;
  limits: FitnessLimits;
}) {
  const largest = Math.max(1, ...Object.values(counts).map(barLength));
  return (
    <ul className={styles.bars}>
      {FITNESS_CATEGORIES.map((category) => (
        <li key={category} className={styles.bar}>
          <span className={styles.barLabel}>
            {CATEGORY_WORDS[category]}{" "}
            <span className={styles.range}>
              ({rangeWords(categoryRange(category, limits))})
            </span>
          </span>
          <meter
            className={`${styles.meter} ${styles[category]}`}
            min={0}
            max={largest}
            value={barLength(counts[category])}
            aria-label={CATEGORY_WORDS[category]}
          />
          <span className={styles.barValue}>
            {countWords(counts[category])}
          </span>
        </li>
      ))}
    </ul>
  );
}
