import type { ReactNode } from "react";
import { ToneBadge } from "@/ui/tone-badge";
import base from "./activities.module.css";
import { ATTENDANCE_WORDS } from "./attendance-status";
import { HISTORY_LOOKS } from "./badge-look";
import styles from "./verification.module.css";
import {
  decisionWords,
  NO_LONGER_MEANT,
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
  const address = photoAddressOf(card.id);
  return (
    <a
      href={address}
      target="_blank"
      rel="noopener"
      className={styles.photoLink}
    >
      {/* biome-ignore lint/performance/noImgElement: the picture is private and is given only after the server has checked who asks, which the image optimiser of the server cannot pass. */}
      <img
        src={address}
        alt={`Foto kehadiran ${card.name}`}
        className={styles.photo}
        loading="lazy"
      />
    </a>
  );
}

/** The status of a decided card, with the reason and who decided. */
function Decision({ card }: { card: VerificationCard }) {
  return (
    <div className={styles.decision}>
      <ToneBadge tone={HISTORY_LOOKS[card.status]}>
        {ATTENDANCE_WORDS[card.status]}
      </ToneBadge>
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
        {!card.isMeant && (
          <div>
            <ToneBadge tone="plain">{NO_LONGER_MEANT}</ToneBadge>
          </div>
        )}
        <p className={base.cardText}>{card.sent}</p>
        {card.isOutsideDates && (
          <div>
            <ToneBadge tone="warning">{OUTSIDE_DATES}</ToneBadge>
          </div>
        )}
        {card.status !== "waiting" && <Decision card={card} />}
        {children}
      </div>
    </article>
  );
}
