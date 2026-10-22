import { AchievementCard } from "./achievement-card";
import styles from "./dashboard.module.css";
import { GradeCard } from "./grade-card";
import { MenteeMentalCard } from "./mentee-mental-card";
import type { MenteeCards } from "./mentee-recap";
import { PhysicalCard } from "./physical-card";

/** The four cards of Dashboard anak asuh, side by side, stacked on a phone. */
export function MenteeCardsRow({ cards }: { cards: MenteeCards }) {
  return (
    <div className={styles.cards}>
      <AchievementCard recap={cards.achievement} />
      <GradeCard grades={cards.grades} />
      <PhysicalCard recap={cards.physical} />
      <MenteeMentalCard published={cards.published} />
    </div>
  );
}
