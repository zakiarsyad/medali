import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { countWords } from "./attendance-marks";
import { attendanceListAddress } from "./meetings-address";
import type { MeetingCard } from "./meetings-overview";
import styles from "./mentoring.module.css";

/** What a card lets the account do with the list of its meeting, if anything. */
function CardAction({
  card,
  groupId,
  mayFillIn,
}: {
  card: MeetingCard;
  groupId: string;
  mayFillIn: boolean;
}) {
  if (!mayFillIn || card.stored !== null) return null;
  return (
    <p className={styles.cardAction}>
      <Link
        href={attendanceListAddress(groupId, card.number)}
        className={shared.button}
      >
        Isi daftar hadir
      </Link>
    </p>
  );
}

function CardLines({ card }: { card: MeetingCard }) {
  const { stored } = card;
  if (stored === null) {
    return <p className={styles.cardLine}>Daftar hadir belum diisi.</p>;
  }
  return (
    <>
      <p className={styles.cardLine}>
        {shownDay(stored.heldOn)} · {stored.topic}
      </p>
      <p className={styles.cardLine}>{countWords(stored.counts, " · ")}</p>
    </>
  );
}

function StateBadge({ isHeld }: { isHeld: boolean }) {
  if (!isHeld) {
    return (
      <span className={`${shared.badge} ${styles.notHeld}`}>Belum diisi</span>
    );
  }
  return <span className={`${shared.badge} ${styles.held}`}>Terlaksana</span>;
}

/** The cards "Pertemuan 1" to the last of one group in the running period. */
export function MeetingCards({
  cards,
  groupId,
  mayFillIn,
}: {
  cards: MeetingCard[];
  groupId: string;
  /** Whether the account may fill in the lists of this group. */
  mayFillIn: boolean;
}) {
  return (
    <div className={styles.cards}>
      {cards.map((card) => (
        <article key={card.number} className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>Pertemuan {card.number}</h2>
            <StateBadge isHeld={card.stored !== null} />
          </div>
          <CardLines card={card} />
          <CardAction card={card} groupId={groupId} mayFillIn={mayFillIn} />
        </article>
      ))}
    </div>
  );
}
