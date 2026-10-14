import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import {
  type CardOffer,
  type DormClarificationCard,
  offerOf,
} from "./clarification-card";
import { ClarificationCardView } from "./clarification-card-view";
import { ClarificationDecide, type DecideAnswer } from "./clarification-decide";
import styles from "./leave.module.css";

/** The last answer to a press on each card, by the key of the card. */
export type CardAnswers = Readonly<Record<string, DecideAnswer>>;

/** What the signed-in account may do on the cards. */
export interface CardRights {
  verify: boolean;
  decide: boolean;
}

function Offer({
  offer,
  id,
  onAnswer,
}: {
  offer: CardOffer;
  id: string;
  onAnswer: (answer: DecideAnswer) => void;
}) {
  if (offer === "waits_for_bam") {
    return (
      <p className={styles.quietLine}>
        Menunggu verifikasi Badan Asrama Mahasiswa sebelum dapat divalidasi.
      </p>
    );
  }
  if (offer === null) return null;
  return <ClarificationDecide id={id} step={offer} onAnswer={onAnswer} />;
}

/**
 * The clarification cards as they are drawn for the answers so far: a
 * card that was kept by a press here has its new status and offers
 * nothing more, and the last answer stays under its card. A press on a
 * file name opens the file. With no card at all the panel says so.
 */
export function ClarificationCardsView({
  cards,
  rights,
  answers,
  emptyWords,
  onOpenFile,
  onAnswer,
}: {
  cards: DormClarificationCard[];
  rights: CardRights;
  answers: CardAnswers;
  /** What is said when there is no card to show. */
  emptyWords: string;
  onOpenFile: (card: DormClarificationCard) => void;
  onAnswer: (cardId: string, answer: DecideAnswer) => void;
}) {
  if (cards.length === 0) return <p className={shared.empty}>{emptyWords}</p>;
  return (
    <ul className={styles.cards}>
      {cards.map((card) => {
        const answer = answers[card.id];
        const status = answer?.status ?? card.status;
        return (
          <ClarificationCardView
            key={card.id}
            card={{ ...card, status }}
            onOpenFile={() => onOpenFile(card)}
          >
            <Offer
              offer={offerOf(status, rights)}
              id={card.id}
              onAnswer={(sent) => onAnswer(card.id, sent)}
            />
            {answer && <FormMessage state={answer.state} />}
          </ClarificationCardView>
        );
      })}
    </ul>
  );
}
