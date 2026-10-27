import { useActionState } from "react";
import { faultMessage, type SaveAnswer } from "./save-not-sent";

/**
 * The save, or what the form held with the words of `faultMessage` when
 * it threw. What is no failure, such as a move to another page, is thrown
 * again.
 */
export function keptWhenNotSent<State extends SaveAnswer, Payload>(
  save: (before: State, payload: Payload) => State | Promise<State>,
): (before: State, payload: Payload) => Promise<State> {
  return async (before, payload) => {
    try {
      return await save(before, payload);
    } catch (error) {
      return { ...before, error: faultMessage(error), done: null };
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
  return useActionState(keptWhenNotSent(save), start);
}
