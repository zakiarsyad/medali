import type { MentalView } from "@/mental-health/mental-recap";
import styles from "./dashboard.module.css";
import { mentalCardLine, mentalCardValue } from "./mental-words";

/** Where section 4 starts, for the card that leads to it. */
export const MENTAL_SECTION = "kesehatan-mental";

/**
 * The card "Kesehatan mental": how many are assessed, never a count of 1
 * to 4, and how many students' data is published to the account.
 * Pressing it moves the page to section 4.
 */
export function MentalCard({ mental }: { mental: MentalView }) {
  return (
    <a className={styles.card} href={`#${MENTAL_SECTION}`}>
      <span className={styles.cardHead}>
        <span className={styles.sectionNo}>4</span>
        Kesehatan mental
      </span>
      <span className={styles.cardValue}>
        {mentalCardValue(mental.recap)} <small>diasesmen</small>
      </span>
      <span className={styles.cardLine}>
        {mentalCardLine(mental.published)}
      </span>
    </a>
  );
}
