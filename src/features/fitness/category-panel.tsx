import type { ReactNode } from "react";
import { CATEGORY_WORDS } from "@/health-notes/category-words";
import { categoryRange } from "@/health-notes/fitness-category";
import {
  FITNESS_CATEGORIES,
  type FitnessLimits,
} from "@/health-notes/fitness-ids";
import shared from "@/ui/data-screen.module.css";
import styles from "./fitness.module.css";
import type { FitnessNumbers } from "./fitness-counts";
import { rangeWords, untestedLine } from "./fitness-words";

/**
 * One bar for each category, with its scores in brackets, as long as
 * its share of the largest, as the prototype draws them. A meter shows
 * the share, so no width is written into the screen code.
 */
function CategoryBars({
  byCategory,
  limits,
}: {
  byCategory: FitnessNumbers["byCategory"];
  limits: FitnessLimits;
}) {
  const largest = Math.max(1, ...Object.values(byCategory));
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
            value={byCategory[category]}
            aria-label={CATEGORY_WORDS[category]}
          />
          <span className={styles.barValue}>
            {byCategory[category].toLocaleString("id-ID")}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * "Kategori": how many students are in each category with the limits in
 * force, how many are not tested, and "Ambang skor" under it.
 */
export function CategoryPanel({
  numbers,
  limits,
  children,
}: {
  numbers: FitnessNumbers;
  limits: FitnessLimits;
  /** "Ambang skor", to change or only to read. */
  children: ReactNode;
}) {
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Kategori</h2>
      <CategoryBars byCategory={numbers.byCategory} limits={limits} />
      <p className={styles.note}>{untestedLine(numbers.untested)}</p>
      {children}
    </section>
  );
}
