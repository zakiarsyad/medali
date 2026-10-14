import type { FormState } from "@/ui/form-message";

/*
 * What Riwayat keeps between presses, apart from how it is drawn, so it
 * can be checked without a browser.
 */

/** What the server answered to the clarification of one row. */
export interface RowAnswer {
  key: string;
  state: FormState;
}

export interface HistoryState {
  /** The row whose form is open: only one is at a time. */
  openKey: string | null;
  /** The last answer, kept until another form is opened. */
  answer: RowAnswer | null;
}

export type HistoryEvent =
  | { kind: "opened"; key: string }
  | { kind: "cancelled" }
  | { kind: "answered"; key: string; state: FormState };

export const NO_ROW_OPEN: HistoryState = { openKey: null, answer: null };

/**
 * Riwayat after a press or an answer. Opening a form clears the last
 * answer. A clarification that was kept closes its own form; a refused
 * one leaves it open, to be sent again. An answer for a row never closes
 * the form of another row that was opened in the meantime.
 */
export function historyAfter(
  state: HistoryState,
  event: HistoryEvent,
): HistoryState {
  if (event.kind === "opened") return { openKey: event.key, answer: null };
  if (event.kind === "cancelled") return { ...state, openKey: null };
  const answer = { key: event.key, state: event.state };
  const wasKept = event.state.done !== null;
  if (wasKept && state.openKey === event.key) return { openKey: null, answer };
  return { openKey: state.openKey, answer };
}
