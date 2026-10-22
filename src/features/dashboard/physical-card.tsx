import { CATEGORY_WORDS } from "@/health-notes/category-words";
import { FITNESS_CATEGORIES } from "@/health-notes/fitness-ids";
import { countWords } from "@/health-notes/shown-count";
import { CardBox } from "./card-box";
import styles from "./dashboard.module.css";
import type { PhysicalRecap, ShownPhysical } from "./physical-recap";
import {
  physicalCardLine,
  physicalCardValue,
  stackParts,
} from "./physical-words";

/** Where section 3 starts, for the card that leads to it. */
export const PHYSICAL_SECTION = "kesehatan-jasmani";

/**
 * A bar of the four categories along the whole group. Drawn as a
 * picture, so no width is written into the screen code; the counts in
 * words are its title.
 */
function CategoryStack({ recap }: { recap: ShownPhysical }) {
  const words = FITNESS_CATEGORIES.map(
    (category) =>
      `${CATEGORY_WORDS[category]} ${countWords(recap.byCategory[category])}`,
  ).join(", ");
  return (
    <svg
      className={styles.stack}
      viewBox="0 0 100 1"
      preserveAspectRatio="none"
      role="img"
      aria-label={words}
    >
      <title>{words}</title>
      {stackParts(recap.byCategory, recap.students).map((part) => (
        <rect
          key={part.category}
          className={styles[`${part.category}Part`]}
          x={part.start}
          y={0}
          width={part.length}
          height={1}
        />
      ))}
    </svg>
  );
}

/**
 * The card "Kesehatan jasmani": the percent prima dan baik, how many are
 * tested and how many need a doctor, and a bar of the categories.
 * Unless `linked` is off, pressing it moves the page to section 3.
 */
export function PhysicalCard({
  recap,
  linked = true,
}: {
  recap: PhysicalRecap;
  /** Whether pressing it moves the page to its section: not where there is none. */
  linked?: boolean;
}) {
  return (
    <CardBox target={linked ? PHYSICAL_SECTION : null}>
      <span className={styles.cardHead}>
        <span className={styles.sectionNo}>3</span>
        Kesehatan jasmani
      </span>
      <span className={styles.cardValue}>
        {physicalCardValue(recap)} <small>prima dan baik</small>
      </span>
      <span className={styles.cardLine}>{physicalCardLine(recap)}</span>
      {recap.kind === "shown" && <CategoryStack recap={recap} />}
    </CardBox>
  );
}
