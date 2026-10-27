import { unstable_rethrow } from "next/navigation";

/** Said when a save did not reach the server, or no answer came back. */
export const SAVE_NOT_SENT =
  "Data tidak terkirim. Periksa koneksi internet, lalu coba lagi.";

/**
 * Said when a save reached the server but failed there, or the server no
 * longer knows it, as after a new version of the app is put live.
 */
export const SAVE_FAILED =
  "Data tidak dapat disimpan. Muat ulang halaman, lalu coba lagi.";

/** What every form that saves says back: a refusal, or that it was done. */
export interface SaveAnswer {
  error: string | null;
  done: string | null;
}

/**
 * The words for a save that threw. The browser throws a `TypeError` when
 * the server cannot be reached; anything else came from the server. What
 * is no failure, such as a move to another page, "not found" or "Akses
 * ditolak", is thrown again.
 */
export function faultMessage(error: unknown): string {
  unstable_rethrow(error);
  if (error instanceof TypeError) return SAVE_NOT_SENT;
  return SAVE_FAILED;
}

/** The refused answer of a save that threw, as a form says it. */
export function refusedSave(message: string): SaveAnswer {
  return { error: message, done: null };
}

/** The same, for a save that answers whether it went through. */
export function refusedResult(message: string): { ok: false; error: string } {
  return { ok: false, error: message };
}

/**
 * What the server answered to a save sent from the screen's own code, or
 * its refusal with `faultMessage` when it threw. A save that throws would
 * otherwise replace the screen and lose what the person typed.
 */
export async function sentOr<Answer>(
  send: () => Promise<Answer>,
  refused: (message: string) => Answer,
): Promise<Answer> {
  try {
    return await send();
  } catch (error) {
    return refused(faultMessage(error));
  }
}
