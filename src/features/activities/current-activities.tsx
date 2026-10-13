import shared from "@/ui/data-screen.module.css";
import styles from "./activities.module.css";
import type { ActivityCard } from "./activity-card";
import { ActivityCardView } from "./activity-card-view";

/** "Berlangsung dan masa unggah foto": a card for each running schedule. */
export function CurrentActivities({ cards }: { cards: ActivityCard[] }) {
  return (
    <section className={styles.part}>
      <h2 className={shared.heading}>Berlangsung dan masa unggah foto</h2>
      {cards.length === 0 ? (
        <div className={shared.panel}>
          <p className={shared.empty}>
            Tidak ada kegiatan yang sedang membuka unggah foto.
          </p>
        </div>
      ) : (
        <div className={styles.cards}>
          {cards.map((card) => (
            <ActivityCardView key={card.id} card={card} />
          ))}
        </div>
      )}
    </section>
  );
}
