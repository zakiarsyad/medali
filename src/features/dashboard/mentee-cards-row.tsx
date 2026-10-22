import { AchievementCard } from "./achievement-card";
import styles from "./dashboard.module.css";
import { GradeCard } from "./grade-card";
import { MenteeMentalCard } from "./mentee-mental-card";
import type { MenteeCards } from "./mentee-recap";
import { PhysicalCard } from "./physical-card";

/**
 * The four cards of Dashboard anak asuh, side by side, stacked on a
 * phone. The view has no sections, so no card leads anywhere.
 */
export function MenteeCardsRow({ cards }: { cards: MenteeCards }) {
  return (
    <div className={styles.cards}>
      <AchievementCard recap={cards.achievement} linked={false} />
      <GradeCard grades={cards.grades} linked={false} />
      <PhysicalCard recap={cards.physical} linked={false} />
      <MenteeMentalCard published={cards.published} />
    </div>
  );
}
