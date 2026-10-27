"use client";

import { type FormEvent, startTransition, useState } from "react";
import type { SchemeInForce } from "@/character-grades/grade-scheme";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { useSaveState } from "@/ui/use-save-state";
import styles from "./character-grades.module.css";
import { saveSchemeAction } from "./scheme-actions";
import { typedOf, VERSION_FIELD } from "./scheme-fields";
import { maySave, schemeFaults } from "./scheme-input";
import { SchemeView } from "./scheme-view";
import { SAVE_QUESTION, schemeNote } from "./scheme-words";

const START: FormState = { error: null, done: null };

/**
 * "Skema bobot" for Kepala Unit: the bar, the total and the sentence
 * follow each change at once, and "Simpan skema" is off while anything
 * typed cannot be saved. Pressing it asks first, since every final grade
 * is worked out again.
 */
export function SchemeForm({ inForce }: { inForce: SchemeInForce }) {
  const [typed, setTyped] = useState(() => typedOf(inForce.scheme));
  const [state, save, pending] = useSaveState(saveSchemeAction, START);
  const faults = schemeFaults(typed);
  const canSave = maySave(typed);

  // Sent from here, not by the browser: the browser would empty the
  // fields of a sent form, and a refused scheme must stay to be corrected.
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!window.confirm(SAVE_QUESTION)) return;
    const form = new FormData(event.currentTarget);
    startTransition(() => save(form));
  }

  return (
    <form onSubmit={send} noValidate>
      <SchemeView
        typed={typed}
        note={schemeNote(inForce.set)}
        faults={faults}
        onType={setTyped}
      >
        <input type="hidden" name={VERSION_FIELD} value={inForce.version} />
        <div className={styles.saveRow}>
          <button
            type="submit"
            className={shared.button}
            disabled={!canSave || pending}
          >
            Simpan skema
          </button>
          {faults.total && <span className={styles.fault}>{faults.total}</span>}
        </div>
        <FormMessage state={state} />
      </SchemeView>
    </form>
  );
}
