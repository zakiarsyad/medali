import type { DecisionAnswer, VerificationCard } from "./verification-card";

/*
 * What the photo cards keep of the decisions made on this screen, apart
 * from how they are drawn, so it can be checked without a browser. Read
 * by the cards in the browser: nothing here may take from the database
 * code.
 */

/** Said when a decision did not reach the server, or no answer came back. */
export const DECISION_NOT_SENT =
  "Putusan tidak terkirim. Periksa koneksi internet, lalu coba lagi.";

/** The last answer to a decision on each card, by the key of the card. */
export type CardAnswers = Readonly<Record<string, DecisionAnswer>>;

export const NO_ANSWERS: CardAnswers = {};

export interface AnsweredCard {
  cardId: string;
  answer: DecisionAnswer;
}

/** The answers after one more: the newest answer of a card replaces its last. */
export function answersAfter(
  answers: CardAnswers,
  { cardId, answer }: AnsweredCard,
): CardAnswers {
  return { ...answers, [cardId]: answer };
}

/** The oldest first, as the list is read; two sent together go by their key. */
function byTimeSent(one: VerificationCard, other: VerificationCard): number {
  if (one.sentAt !== other.sentAt) return one.sentAt < other.sentAt ? -1 : 1;
  return one.id < other.id ? -1 : 1;
}

/**
 * The cards the screen shows: those the list holds now, and with them
 * the cards that were decided on this screen and have left the list
 * since, as a validated photo leaves the list of waiting ones. Such a
 * card stays, in its place, as the answer gave it, so the person sees
 * what became of it. A card the list still holds is shown as the list
 * has it, which is never older than an answer.
 */
export function shownCards(
  listed: readonly VerificationCard[],
  answers: CardAnswers,
): VerificationCard[] {
  const listedIds = new Set(listed.map((card) => card.id));
  const shown = [...listed];
  for (const { card } of Object.values(answers)) {
    if (card !== null && !listedIds.has(card.id)) shown.push(card);
  }
  return shown.sort(byTimeSent);
}

/**
 * The answer to a decision that was sent. One that did not arrive is an
 * answer too: the card stays as it is and says to try again. `rethrow`
 * throws again what is no failure, as an answer that leads elsewhere.
 */
export async function answerTo(
  send: () => Promise<DecisionAnswer>,
  rethrow: (error: unknown) => void,
): Promise<DecisionAnswer> {
  try {
    return await send();
  } catch (error) {
    rethrow(error);
    return { state: { error: DECISION_NOT_SENT, done: null }, card: null };
  }
}
