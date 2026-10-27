import { unstable_rethrow } from "next/navigation";
import { useActionState } from "react";
import { SAVE_NOT_SENT, type SaveAnswer } from "./save-not-sent";

/**
 * The save, or what the form held with `SAVE_NOT_SENT` when it did not
 * arrive. `rethrow` throws again what is no failure, as an answer that
 * leads elsewhere.
 */
export function keptWhenNotSent<State extends SaveAnswer, Payload>(
  save: (before: State, payload: Payload) => State | Promise<State>,
  rethrow: (error: unknown) => void,
): (before: State, payload: Payload) => Promise<State> {
  return async (before, payload) => {
    try {
      return await save(before, payload);
    } catch (error) {
      rethrow(error);
      return { ...before, error: SAVE_NOT_SENT, done: null };
    }
  };
}

/**
 * `useActionState` for a form that saves through the server. A save that
 * throws, as one does when it cannot reach the server, would otherwise
 * replace the screen and lose what the person typed; here it is refused
 * under the button like any other refused save.
 */
export function useSaveState<State extends SaveAnswer, Payload>(
  save: (before: State, payload: Payload) => State | Promise<State>,
  start: Awaited<State>,
): [
  state: Awaited<State>,
  dispatch: (payload: Payload) => void,
  isPending: boolean,
] {
  return useActionState(keptWhenNotSent(save, unstable_rethrow), start);
}
