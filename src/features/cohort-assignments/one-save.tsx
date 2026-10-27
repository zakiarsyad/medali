"use client";

import {
  createContext,
  type ReactNode,
  use,
  useState,
  useTransition,
} from "react";
import { FormMessage, type FormState } from "@/ui/form-message";
import { refusedSave, sentOr } from "@/ui/save-not-sent";
import { isToldAbove } from "./answer-place";
import styles from "./cohort-assignments.module.css";

const START: FormState = { error: null, done: null };

/** A server action of steps 2 and 3. */
type ChangeAction = (before: FormState, form: FormData) => Promise<FormState>;

interface OneSave {
  /** Whether a change is on its way to the server, or its answer to the tab. */
  isSaving: boolean;
  /** Sends a change, and holds the other controls until the tab shows it. */
  save: (send: () => void | Promise<void>) => void;
  /**
   * Tells an answer whose page no longer holds the button that was pressed,
   * or with null takes away what was told.
   */
  announce: (answer: FormState | null) => void;
}

const OneSaveContext = createContext<OneSave | null>(null);

/**
 * Holds the controls of a penetapan to one change at a time. Every change
 * is sent with the version that is shown, so a second one sent before the
 * first came back would be refused as made from an older draft.
 *
 * "Tetapkan" and "Batalkan penetapan" replace the panel their button
 * stands in, and a message under the button would go with it. So would a
 * refusal that comes with the angkatan fixed or cancelled by someone else
 * meanwhile. Both are said here instead, above the angkatan, until the
 * next change.
 */
export function OneSaveAtATime({ children }: { children: ReactNode }) {
  const [isSaving, startSaving] = useTransition();
  const [announced, announce] = useState<FormState | null>(null);

  function save(send: () => void | Promise<void>) {
    announce(null);
    startSaving(send);
  }

  return (
    <OneSaveContext value={{ isSaving, save, announce }}>
      {announced !== null && (
        <div className={styles.announced}>
          <FormMessage state={announced} />
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

/**
 * The answer a control of steps 2 and 3 shows under it, and how it sends a
 * change. A refusal that comes with the angkatan fixed meanwhile is said
 * above the angkatan instead, as steps 2 and 3 are then gone from the page.
 */
export function useChangeAnswer(
  action: ChangeAction,
): [FormState, (form: FormData) => Promise<void>] {
  const { announce } = useOneSave();
  const [answer, setAnswer] = useState(START);

  async function sendChange(form: FormData) {
    announce(null);
    const after = await sentOr(() => action(START, form), refusedSave);
    if (isToldAbove("change", after)) {
      announce(after);
      return;
    }
    setAnswer(after);
  }

  return [answer, sendChange];
}
