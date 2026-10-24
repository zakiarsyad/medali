import shared from "@/ui/data-screen.module.css";
import { toneBadge } from "@/ui/tone-badge";
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

/** Berat is shown stronger than the bad look, in solid red. */
const CATEGORY_LOOK: Record<PenaltyCategory, string | undefined> = {
  light: toneBadge("warning"),
  medium: toneBadge("bad"),
  heavy: `${shared.badge} ${styles.heavy}`,
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
    <span className={CATEGORY_LOOK[category]}>
      {jenjangWords(category, level)}
    </span>
  );
}
