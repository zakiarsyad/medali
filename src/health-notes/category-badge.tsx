import type { BadgeTone } from "@/ui/badge-tone";
import { toneBadge } from "@/ui/tone-badge";
import { CATEGORY_WORDS } from "./category-words";
import type { ShownCategory } from "./fitness-category";
import type { FinalCategory } from "./health-category";
import styles from "./health-notes.module.css";
import { FROM_NOTE_MARK } from "./health-words";

/** Prima and Baik both say all is well; their words tell them apart. */
const CATEGORY_TONES: Record<ShownCategory, BadgeTone> = {
  excellent: "good",
  good: "good",
  attention: "warning",
  medical: "bad",
  untested: "plain",
};

/** A category, or Belum dites, in the colour of what it means. */
export function CategoryBadge({ category }: { category: ShownCategory }) {
  return (
    <span className={toneBadge(CATEGORY_TONES[category])}>
      {CATEGORY_WORDS[category]}
    </span>
  );
}

/**
 * A student's final category, marked "berdasarkan catatan kesehatan"
 * when their note made it more serious than the test. The mark tells
 * that a note exists, so it shows only to who may read the note.
 */
export function FinalCategoryBadge({
  final,
  showsMark,
}: {
  final: FinalCategory;
  showsMark: boolean;
}) {
  return (
    <>
      <CategoryBadge category={final.category} />
      {showsMark && final.fromNote && (
        <span className={styles.mark}>{FROM_NOTE_MARK}</span>
      )}
    </>
  );
}
