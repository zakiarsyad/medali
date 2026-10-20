"use client";

import { useActionState, useState } from "react";
import type { LimitsInForce } from "@/health-notes/fitness-limits";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { sendForm } from "@/ui/send-form";
import styles from "./fitness.module.css";
import { saveLimitsAction } from "./fitness-actions";
import { LIMITS_VERSION_FIELD, typedLimitsOf } from "./fitness-input";
import { limitsNote } from "./fitness-words";
import { LimitsView } from "./limits-view";

const START: FormState = { error: null, done: null };

/**
 * "Ambang skor" for Kepala Unit. The server says what is wrong with
 * limits that cannot be saved, and saves nothing then; once saved, every
 * category of the tab is worked out again.
 */
export function LimitsForm({ inForce }: { inForce: LimitsInForce }) {
  const [typed, setTyped] = useState(() => typedLimitsOf(inForce.limits));
  const [state, save, pending] = useActionState(saveLimitsAction, START);

  return (
    // noValidate: the server says what is wrong, in the app's own words.
    <form onSubmit={(event) => sendForm(event, save)} noValidate>
      <LimitsView
        typed={typed}
        note={limitsNote(inForce.set)}
        onType={setTyped}
      >
        <input
          type="hidden"
          name={LIMITS_VERSION_FIELD}
          value={inForce.version}
        />
        <div className={styles.saveRow}>
          <button type="submit" className={shared.button} disabled={pending}>
            Simpan ambang
          </button>
          <FormMessage state={state} />
        </div>
      </LimitsView>
    </form>
  );
}
