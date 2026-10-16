import shared from "@/ui/data-screen.module.css";
import styles from "./fitness.module.css";
import type { ShownCategory } from "./fitness-category";
import { CATEGORY_WORDS } from "./fitness-words";

/** A category, or Belum dites, in its colour. */
export function CategoryBadge({ category }: { category: ShownCategory }) {
  return (
    <span className={`${shared.badge} ${styles.category} ${styles[category]}`}>
      {CATEGORY_WORDS[category]}
    </span>
  );
}
