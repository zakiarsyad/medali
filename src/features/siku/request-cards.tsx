import type { RequestCard } from "./request-board";
import { RequestCardView } from "./request-card-view";
import styles from "./siku.module.css";

/** The request cards of one page of the staff panel. */
export function RequestCards({ cards }: { cards: readonly RequestCard[] }) {
  return (
    <div className={styles.cards}>
      {cards.map((card) => (
        <RequestCardView key={card.id} card={card} />
      ))}
    </div>
  );
}
