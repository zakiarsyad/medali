"use client";

import { useActionState, useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { saveMainIndicatorsAction } from "./actions";
import styles from "./curriculum.module.css";
import { ValueBox } from "./indicator-boxes";
import { INDICATOR_MAX_LENGTH } from "./indicator-input";
import type { ValueIndicators } from "./main-indicators";

const START: FormState = { error: null, done: null };

function textsByCode(values: ValueIndicators[]): Record<string, string> {
  const indicators = values.flatMap((value) => value.indicators);
  return Object.fromEntries(indicators.map(({ code, text }) => [code, text]));
}

/** The 24 texts of the main indicators as fields, to change and save. */
export function IndicatorForm({
  values,
  version,
  onSaved,
  onCancel,
}: {
  values: ValueIndicators[];
  /** The version of the texts the form opens on. */
  version: string;
  onSaved: (message: string) => void;
  onCancel: () => void;
}) {
  // Kept here, not in the fields alone: the browser empties a sent form,
  // and what was typed must stay when the save is refused.
  const [texts, setTexts] = useState(() => textsByCode(values));
  // Fixed when the form opens: the page may load newer texts while it is
  // open, and the save must still be checked against the texts it shows.
  const [openedOn] = useState(version);

  async function send(before: FormState, form: FormData): Promise<FormState> {
    const after = await saveMainIndicatorsAction(before, form);
    if (after.done) onSaved(after.done);
    return after;
  }

  const [state, action, pending] = useActionState(send, START);
  return (
    <form action={action}>
      <input type="hidden" name="version" value={openedOn} />
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
                    maxLength={INDICATOR_MAX_LENGTH}
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
