import { CategoryBadge } from "@/health-notes/category-badge";
import { CATEGORY_MEANINGS, rangeWords } from "@/health-notes/category-words";
import { categoryRange } from "@/health-notes/fitness-category";
import {
  FITNESS_CATEGORIES,
  type FitnessLimits,
} from "@/health-notes/fitness-ids";
import shared from "@/ui/data-screen.module.css";
import styles from "./dashboard.module.css";

/** "Arti kategori": each category in its colour, its scores and what it means. */
export function CategoryMeanings({ limits }: { limits: FitnessLimits }) {
  return (
    <div className={shared.panel}>
      <h3 className={shared.heading}>Arti kategori</h3>
      <ul className={styles.meanings}>
        {FITNESS_CATEGORIES.map((category) => (
          <li key={category} className={styles.meaning}>
            <span>
              <CategoryBadge category={category} />{" "}
              <span className={styles.range}>
                {rangeWords(categoryRange(category, limits))}
              </span>
            </span>
            <span className={styles.caption}>
              {CATEGORY_MEANINGS[category]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
