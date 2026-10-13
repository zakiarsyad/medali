"use client";

import { useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import styles from "./activities.module.css";
import type { ActivityCard } from "./activity-card";
import { ActivityCardView } from "./activity-card-view";
import { PhotoSender } from "./photo-sender";

/** What the server answered to the photo of one card. */
interface Answer {
  cardId: string;
  state: FormState;
}

/**
 * "Berlangsung dan masa unggah foto": a card for each running schedule.
 * It holds which card has its upload open, as only one is at a time, and
 * what the server last answered. The answer stays under its card after
 * the card has lost its upload, and above the cards when the card itself
 * is gone, as after the upload time has closed.
 */
export function CurrentActivities({ cards }: { cards: ActivityCard[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const answeredCardIsGone =
    answer !== null && !cards.some((card) => card.id === answer.cardId);

  function open(cardId: string) {
    setAnswer(null);
    setOpenId(cardId);
  }

  function answered(cardId: string, state: FormState) {
    setAnswer({ cardId, state });
    // A refused photo may be sent again; a kept one closes the upload.
    if (state.done !== null) setOpenId(null);
  }

  return (
    <section className={styles.part}>
      <h2 className={shared.heading}>Berlangsung dan masa unggah foto</h2>
      {answer !== null && answeredCardIsGone && (
        <FormMessage state={answer.state} />
      )}
      {cards.length === 0 ? (
        <div className={shared.panel}>
          <p className={shared.empty}>
            Tidak ada kegiatan yang sedang membuka unggah foto.
          </p>
        </div>
      ) : (
        <div className={styles.cards}>
          {cards.map((card) => (
            <ActivityCardView key={card.id} card={card}>
              {card.maySend && openId === card.id && (
                <PhotoSender
                  scheduleId={card.id}
                  onAnswer={(state) => answered(card.id, state)}
                  onCancel={() => setOpenId(null)}
                />
              )}
              {card.maySend && openId !== card.id && (
                <div>
                  <button
                    type="button"
                    className={shared.button}
                    onClick={() => open(card.id)}
                  >
                    Unggah foto kehadiran
                  </button>
                </div>
              )}
              {answer?.cardId === card.id && (
                <FormMessage state={answer.state} />
              )}
            </ActivityCardView>
          ))}
        </div>
      )}
    </section>
  );
}
