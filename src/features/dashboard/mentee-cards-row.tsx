import { AchievementCard } from "./achievement-card";
import styles from "./dashboard.module.css";
import { GradeCard } from "./grade-card";
import { MenteeMentalCard } from "./mentee-mental-card";
import type { MenteeCards } from "./mentee-recap";
import { MENTEES_NOT_ASSESSED } from "./mentee-words";
import { PhysicalCard } from "./physical-card";

/**
 * The four cards of Dashboard anak asuh, side by side, stacked on a
 * phone. Pressing a card with a section below moves the page to it.
 */
export function MenteeCardsRow({ cards }: { cards: MenteeCards }) {
  return (
    <div className={styles.cards}>
      <AchievementCard
        recap={cards.achievement}
        emptyWords={MENTEES_NOT_ASSESSED}
      />
      <GradeCard grades={cards.grades} />
      <PhysicalCard recap={cards.physical} linked={false} />
      <MenteeMentalCard published={cards.published} />
    </div>
  );
}
