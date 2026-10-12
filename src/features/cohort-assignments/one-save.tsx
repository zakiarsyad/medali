"use client";

import { createContext, type ReactNode, use, useTransition } from "react";

interface OneSave {
  /** Whether a change is on its way to the server, or its answer to the tab. */
  isSaving: boolean;
  /** Sends a change, and holds the other controls until the tab shows it. */
  save: (send: () => void) => void;
}

const OneSaveContext = createContext<OneSave | null>(null);

/**
 * Holds the controls of a draft to one change at a time. Every change is
 * sent with the version of the draft that is shown, so a second one sent
 * before the first came back would be refused as made from an older draft.
 */
export function OneSaveAtATime({ children }: { children: ReactNode }) {
  const [isSaving, save] = useTransition();
  return <OneSaveContext value={{ isSaving, save }}>{children}</OneSaveContext>;
}

export function useOneSave(): OneSave {
  const oneSave = use(OneSaveContext);
  if (oneSave === null) {
    throw new Error("A control of a draft stands outside OneSaveAtATime.");
  }
  return oneSave;
}
