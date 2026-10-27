import { unstable_rethrow } from "next/navigation";

/** Said when a save did not reach the server, or no answer came back. */
export const SAVE_NOT_SENT =
  "Data tidak terkirim. Periksa koneksi internet, lalu coba lagi.";

/** What every form that saves says back: a refusal, or that it was done. */
export interface SaveAnswer {
  error: string | null;
  done: string | null;
}

/** The refused answer of a save that did not reach the server. */
export const NOT_SENT: SaveAnswer = { error: SAVE_NOT_SENT, done: null };

/** The same, for a save that answers whether it went through. */
export const NOT_SENT_RESULT = { ok: false, error: SAVE_NOT_SENT } as const;

/**
 * What the server answered to a save sent from the screen's own code, or
 * `notSent` when it did not arrive. A save that throws would otherwise
 * replace the screen and lose what the person typed. What is no failure,
 * such as a move to another page, is thrown again.
 */
export async function sentOr<Answer>(
  send: () => Promise<Answer>,
  notSent: Answer,
): Promise<Answer> {
  try {
    return await send();
  } catch (error) {
    unstable_rethrow(error);
    return notSent;
  }
}
