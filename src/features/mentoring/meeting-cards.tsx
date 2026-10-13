import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { countWords } from "./attendance-marks";
import type { MeetingCard } from "./meetings-overview";
import styles from "./mentoring.module.css";

function Card({ card }: { card: MeetingCard }) {
  const { number, stored } = card;
  return (
    <article className={styles.card}>
      <div className={styles.cardHead}>
        <h2 className={styles.cardTitle}>Pertemuan {number}</h2>
        {stored === null ? (
          <span className={`${shared.badge} ${styles.notHeld}`}>
            Belum diisi
          </span>
        ) : (
          <span className={`${shared.badge} ${styles.held}`}>Terlaksana</span>
        )}
      </div>
      {stored === null ? (
        <p className={styles.cardLine}>Daftar hadir belum diisi.</p>
      ) : (
        <>
          <p className={styles.cardLine}>
            {shownDay(stored.heldOn)} · {stored.topic}
          </p>
          <p className={styles.cardLine}>{countWords(stored.counts, " · ")}</p>
        </>
      )}
    </article>
  );
}

/** The cards "Pertemuan 1" to the last of one group in the running period. */
export function MeetingCards({ cards }: { cards: MeetingCard[] }) {
  return (
    <div className={styles.cards}>
      {cards.map((card) => (
        <Card key={card.number} card={card} />
      ))}
    </div>
  );
}
