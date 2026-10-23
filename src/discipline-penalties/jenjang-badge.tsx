import shared from "@/ui/data-screen.module.css";
import styles from "./jenjang-badge.module.css";
import {
  jenjangWords,
  type PenaltyCategory,
  type PenaltyLevel,
} from "./penalty-kinds";

/*
 * Read by the screen parts in the browser, so nothing here may take from
 * the database code.
 */

const CATEGORY_LOOK: Record<PenaltyCategory, string | undefined> = {
  light: styles.light,
  medium: styles.medium,
  heavy: styles.heavy,
};

/** "Ringan · jenjang pertama", in the colour of its Kategori. */
export function JenjangBadge({
  category,
  level,
}: {
  category: PenaltyCategory;
  level: PenaltyLevel;
}) {
  return (
    <span className={`${shared.badge} ${CATEGORY_LOOK[category] ?? ""}`}>
      {jenjangWords(category, level)}
    </span>
  );
}
