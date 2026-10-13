import type { FormState } from "@/ui/form-message";

/*
 * What the running cards keep between presses, apart from how they are
 * drawn, so it can be checked without a browser.
 */

/** What the server answered to the photo of one card. */
export interface CardAnswer {
  cardId: string;
  state: FormState;
}

export interface CardsState {
  /** The card whose upload is open: only one is at a time. */
  openId: string | null;
  /** The last answer, kept until another upload is opened. */
  answer: CardAnswer | null;
}

export type CardsEvent =
  | { kind: "opened"; cardId: string }
  | { kind: "cancelled" }
  | { kind: "answered"; cardId: string; state: FormState };

export const NO_CARD_OPEN: CardsState = { openId: null, answer: null };

/**
 * The cards after a press or an answer. Opening an upload clears the
 * last answer. A photo that was kept closes its own upload; a refused
 * one leaves it open, to be sent again. An answer for a card never
 * closes the upload of another card that was opened in the meantime.
 */
export function cardsAfter(state: CardsState, event: CardsEvent): CardsState {
  if (event.kind === "opened") return { openId: event.cardId, answer: null };
  if (event.kind === "cancelled") return { ...state, openId: null };
  const answer = { cardId: event.cardId, state: event.state };
  const wasKept = event.state.done !== null;
  const isOpenCard = state.openId === event.cardId;
  if (wasKept && isOpenCard) return { openId: null, answer };
  return { openId: state.openId, answer };
}
