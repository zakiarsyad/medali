import { CardBox } from "./card-box";
import styles from "./dashboard.module.css";
import { MENTAL_SECTION } from "./mental-card";
import type { PublishedCounts } from "./mental-recap";
import { menteeMentalLine } from "./mentee-words";

/**
 * The card "Kesehatan mental" of Dashboard anak asuh: how many anak asuh
 * have data published to the Pengasuh, and of them how many need
 * counselling. No anonymous count of the screenings, as in the prototype.
 * Pressing it moves the page to section 4.
 */
export function MenteeMentalCard({
  published,
}: {
  published: PublishedCounts;
}) {
  return (
    <CardBox target={MENTAL_SECTION}>
      <span className={styles.cardHead}>
        <span className={styles.sectionNo}>4</span>
        Kesehatan mental
      </span>
      <span className={styles.cardValue}>
        {published.matching.toLocaleString("id-ID")}{" "}
        <small>dipublikasikan</small>
      </span>
      <span className={styles.cardLine}>{menteeMentalLine(published)}</span>
    </CardBox>
  );
}
