import type { ReactNode } from "react";
import { CategoryBars } from "@/health-notes/category-bars";
import type { FitnessLimits } from "@/health-notes/fitness-ids";
import shared from "@/ui/data-screen.module.css";
import styles from "./fitness.module.css";
import type { FitnessNumbers } from "./fitness-counts";
import { untestedLine } from "./fitness-words";

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
      <CategoryBars counts={numbers.byCategory} limits={limits} />
      <p className={styles.note}>{untestedLine(numbers.untested)}</p>
      {children}
    </section>
  );
}
