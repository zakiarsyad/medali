import type { ReactNode } from "react";
import base from "./activities.module.css";
import { ATTENDANCE_WORDS } from "./attendance-status";
import { HISTORY_LOOKS } from "./badge-look";
import { LookBadge } from "./look-badge";
import styles from "./verification.module.css";
import {
  decisionWords,
  NO_PHOTO_HERE,
  OUTSIDE_DATES,
  photoAddressOf,
  type VerificationCard,
} from "./verification-card";

function Photo({ card }: { card: VerificationCard }) {
  if (card.removed !== null) {
    return <p className={styles.noPhoto}>{card.removed}</p>;
  }
  if (!card.hasPhoto) return <p className={styles.noPhoto}>{NO_PHOTO_HERE}</p>;
  return (
    // biome-ignore lint/performance/noImgElement: the picture is private and is given only after the server has checked who asks, which the image optimiser of the server cannot pass.
    <img
      src={photoAddressOf(card.id)}
      alt={`Foto kehadiran ${card.name}`}
      className={styles.photo}
      loading="lazy"
    />
  );
}

/** The status of a decided card, with the reason and who decided. */
function Decision({ card }: { card: VerificationCard }) {
  return (
    <div className={styles.decision}>
      <LookBadge
        words={ATTENDANCE_WORDS[card.status]}
        look={HISTORY_LOOKS[card.status]}
      />
      <span className={base.cardText}>{decisionWords(card)}</span>
    </div>
  );
}

/**
 * One attendance for which a photo was sent, as a card: the picture,
 * which loads as the card scrolls into view, who sent it, for which
 * activity and when, and where it stands once decided. `children` is
 * what the card offers to do, when anything.
 */
export function VerificationCardView({
  card,
  children,
}: {
  card: VerificationCard;
  children?: ReactNode;
}) {
  return (
    <article className={styles.photoCard}>
      <Photo card={card} />
      <div className={styles.photoBody}>
        <h3 className={base.cardName}>{card.name}</h3>
        <p className={base.cardText}>
          {card.nim} · {card.program}
        </p>
        <p className={base.cardText}>{card.activity}</p>
        <p className={base.cardText}>{card.sent}</p>
        {card.isOutsideDates && (
          <div>
            <LookBadge words={OUTSIDE_DATES} look="warn" />
          </div>
        )}
        {card.status !== "waiting" && <Decision card={card} />}
        {children}
      </div>
    </article>
  );
}
