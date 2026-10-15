import type { FormState } from "@/ui/form-message";

/*
 * Sending "Batalkan" of a reduction, apart from the browser, so what it
 * answers when the request is lost can be checked. Read by the screen
 * parts in the browser, so nothing here may take from the database code.
 */

/** Said when the undoing did not reach the server, or no answer came back. */
export const UNDO_NOT_SENT =
  "Pengurangan belum dibatalkan karena tidak terkirim. Periksa koneksi internet, lalu coba lagi.";

/** The ties of the undoing to the server and to the framework. */
export interface UndoEdges {
  send: (id: string) => Promise<FormState>;
  /** Throws again what the framework must handle itself, such as a redirect. */
  rethrow: (error: unknown) => void;
}

/**
 * Sends the undoing of one reduction. A lost request is answered with a
 * message instead of the error page, so the tab stays as it was.
 */
export async function sendUndo(
  id: string,
  edges: UndoEdges,
): Promise<FormState> {
  try {
    return await edges.send(id);
  } catch (error) {
    edges.rethrow(error);
    return { error: UNDO_NOT_SENT, done: null };
  }
}
