"use client";

import {
  createContext,
  type ReactNode,
  use,
  useState,
  useTransition,
} from "react";
import { FormMessage } from "@/ui/form-message";
import styles from "./cohort-assignments.module.css";

interface OneSave {
  /** Whether a change is on its way to the server, or its answer to the tab. */
  isSaving: boolean;
  /** Sends a change, and holds the other controls until the tab shows it. */
  save: (send: () => void | Promise<void>) => void;
  /** Says what a step did when the step took away the panel of its button. */
  announce: (words: string) => void;
}

const OneSaveContext = createContext<OneSave | null>(null);

/**
 * Holds the controls of a penetapan to one change at a time. Every change
 * is sent with the version that is shown, so a second one sent before the
 * first came back would be refused as made from an older draft.
 *
 * "Tetapkan" and "Batalkan penetapan" replace the panel their button
 * stands in, and a message under the button would go with it. What they
 * did is said here instead, above the angkatan, until the next change.
 */
export function OneSaveAtATime({ children }: { children: ReactNode }) {
  const [isSaving, startSaving] = useTransition();
  const [announced, announce] = useState<string | null>(null);

  function save(send: () => void | Promise<void>) {
    announce(null);
    startSaving(send);
  }

  return (
    <OneSaveContext value={{ isSaving, save, announce }}>
      {announced !== null && (
        <div className={styles.announced}>
          <FormMessage state={{ error: null, done: announced }} />
        </div>
      )}
      {children}
    </OneSaveContext>
  );
}

export function useOneSave(): OneSave {
  const oneSave = use(OneSaveContext);
  if (oneSave === null) {
    throw new Error("A control of a penetapan stands outside OneSaveAtATime.");
  }
  return oneSave;
}
