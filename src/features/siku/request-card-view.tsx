import type { ReactNode } from "react";
import { ROLES } from "@/auth/roles";
import shared from "@/ui/data-screen.module.css";
import { shownDay, shownMoment } from "@/ui/day";
import type { RequestCard } from "./request-board";
import { RequestPhotoThumbs } from "./request-photo-thumbs";
import { RequestStatusBadge } from "./request-status-badge";
import styles from "./siku.module.css";
import { REASON_WORDS } from "./siku-words";

export const SAME_GAIN_WARNING =
  "Mahasiswa ini sudah mendapat penambahan dengan kriteria yang sama pada tanggal kegiatan ini. Pastikan satu kegiatan tidak dihitung dua kali.";

/** Who decided a request and when, with the note, or null while it waits. */
function decisionWords(card: RequestCard): string | null {
  const { decidedBy, decidedAs, decidedAt } = card;
  if (decidedAs === null || decidedAt === null) return null;
  const who = `${decidedBy ?? "-"} (${ROLES[decidedAs].title})`;
  const checked = `Diperiksa ${who}, ${shownMoment(decidedAt)}.`;
  return card.note === "" ? checked : `${checked} Catatan: ${card.note}`;
}

/**
 * One request as a card of the staff panel: the student, where it
 * stands, the reason, the day of the activity and when it was sent, the
 * report and the photos, and who decided it. A card that waits warns
 * when the student already has a gain with the same reason on that day.
 * `children` is what the card offers to do, when anything.
 */
export function RequestCardView({
  card,
  children,
}: {
  card: RequestCard;
  children?: ReactNode;
}) {
  const decision = decisionWords(card);
  return (
    <article className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <b>{card.name}</b>
          <span className={shared.detail}>
            {card.nim} · {card.program}
          </span>
        </div>
        <RequestStatusBadge status={card.status} points={card.points} />
      </div>
      <b>{REASON_WORDS[card.reason]}</b>
      <p className={shared.detail}>
        Kegiatan {shownDay(card.day)} · diajukan {shownMoment(card.sentAt)}
      </p>
      <p className={shared.typed}>{card.report}</p>
      <RequestPhotoThumbs photos={card.photos} />
      {decision !== null && <p className={shared.detail}>{decision}</p>}
      {card.status === "waiting" && card.hasSameGain && (
        <p className={styles.warning}>{SAME_GAIN_WARNING}</p>
      )}
      {children}
    </article>
  );
}
