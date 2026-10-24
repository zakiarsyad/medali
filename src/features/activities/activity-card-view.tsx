import type { ReactNode } from "react";
import { ToneBadge } from "@/ui/tone-badge";
import styles from "./activities.module.css";
import type { ActivityCard } from "./activity-card";
import { ValueTags } from "./value-tags";

/**
 * One running schedule as a card: what it is, when and where, until when
 * a photo may be uploaded, and where the student's own attendance
 * stands. `children` is what the card offers to do, when anything.
 */
export function ActivityCardView({
  card,
  children,
}: {
  card: ActivityCard;
  children?: ReactNode;
}) {
  return (
    <article className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <h3 className={styles.cardName}>{card.name}</h3>
          <p className={styles.cardText}>{card.when}</p>
          <p className={styles.cardText}>{card.until}</p>
        </div>
        <ToneBadge tone={card.badge.look}>{card.badge.words}</ToneBadge>
      </div>
      {card.description !== "" && (
        <p className={styles.cardText}>{card.description}</p>
      )}
      <div className={styles.tags}>
        <ValueTags valueKeys={card.valueKeys} />
      </div>
      {card.photoLine !== null && (
        <p className={styles.cardText}>{card.photoLine}</p>
      )}
      {children}
    </article>
  );
}
