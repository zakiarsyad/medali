import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import styles from "./activities.module.css";
import type { ActivityCard } from "./activity-card";
import { ActivityCardView } from "./activity-card-view";
import type { CardsState } from "./cards-state";
import { PhotoSender } from "./photo-sender";
import type { StartSend } from "./photo-upload";

/**
 * "Berlangsung dan masa unggah foto" as it is drawn for one state: a
 * card for each running schedule, with its upload when that is open and
 * "Unggah foto kehadiran" when it may be opened. The last answer stays
 * under its card after the card has lost its upload, and above the cards
 * when the card itself is gone, as after the upload time has closed.
 */
export function CurrentActivitiesView({
  cards,
  state,
  startSend,
  onOpen,
  onCancel,
  onAnswer,
}: {
  cards: ActivityCard[];
  state: CardsState;
  startSend: StartSend;
  onOpen: (cardId: string) => void;
  onCancel: () => void;
  onAnswer: (cardId: string, answer: FormState) => void;
}) {
  const { openId, answer } = state;
  const answeredCardIsGone =
    answer !== null && !cards.some((card) => card.id === answer.cardId);
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
                  startSend={startSend}
                  onAnswer={(sent) => onAnswer(card.id, sent)}
                  onCancel={onCancel}
                />
              )}
              {card.maySend && openId !== card.id && (
                <div>
                  <button
                    type="button"
                    className={shared.button}
                    onClick={() => onOpen(card.id)}
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
