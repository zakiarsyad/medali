"use client";

import { useActionState, useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { saveMainIndicatorsAction } from "./actions";
import styles from "./curriculum.module.css";
import { ValueBox } from "./indicator-boxes";
import type { ValueIndicators } from "./main-indicators";

const START: FormState = { error: null, done: null };

function textsByCode(values: ValueIndicators[]): Record<string, string> {
  const indicators = values.flatMap((value) => value.indicators);
  return Object.fromEntries(indicators.map(({ code, text }) => [code, text]));
}

/** The 24 texts of the main indicators as fields, to change and save. */
export function IndicatorForm({
  values,
  onSaved,
  onCancel,
}: {
  values: ValueIndicators[];
  onSaved: (message: string) => void;
  onCancel: () => void;
}) {
  // Kept here, not in the fields alone: the browser empties a sent form,
  // and what was typed must stay when the save is refused.
  const [texts, setTexts] = useState(() => textsByCode(values));

  async function send(before: FormState, form: FormData): Promise<FormState> {
    const after = await saveMainIndicatorsAction(before, form);
    if (after.done) onSaved(after.done);
    return after;
  }

  const [state, action, pending] = useActionState(send, START);
  return (
    <form action={action}>
      <div className={styles.boxes}>
        {values.map((value) => (
          <ValueBox key={value.key} value={value}>
            <div className={styles.fields}>
              {value.indicators.map(({ code, stage }) => (
                <label key={code} className={styles.fieldRow}>
                  <span className={shared.badge}>{code}</span>
                  <span className={styles.stage}>{stage}</span>
                  <input
                    name={code}
                    className={`${shared.input} ${styles.text}`}
                    value={texts[code] ?? ""}
                    onChange={(event) =>
                      setTexts({ ...texts, [code]: event.target.value })
                    }
                  />
                </label>
              ))}
            </div>
          </ValueBox>
        ))}
      </div>
      <div className={styles.formEnd}>
        {state.error && <FormMessage state={state} />}
        <div className={shared.actions}>
          <button type="submit" className={shared.button} disabled={pending}>
            Simpan indikator utama
          </button>
          <button type="button" className={shared.quiet} onClick={onCancel}>
            Batal
          </button>
        </div>
      </div>
    </form>
  );
}
