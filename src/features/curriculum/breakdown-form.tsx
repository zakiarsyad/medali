"use client";

import {
  type FormEvent,
  startTransition,
  useActionState,
  useState,
} from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { saveStageBreakdownAction } from "./actions";
import { BreakdownTitle } from "./breakdown-box";
import { ACTIVITY_MAX_LENGTH, TEXT_MAX_LENGTH } from "./breakdown-input";
import styles from "./curriculum.module.css";
import { IndicatorTick } from "./indicator-tick";
import type { MainIndicator } from "./main-indicators";
import { toggled } from "./ppks-activities";
import type { ValueBreakdown } from "./stage-breakdown";

const START: FormState = { error: null, done: null };

/** The form that changes what one nilai means at the chosen tahap. */
export function BreakdownForm({
  tahapNo,
  value,
  indicators,
  onSaved,
  onCancel,
}: {
  tahapNo: number;
  value: ValueBreakdown;
  /** The four main indicators of the nilai, as they are now. */
  indicators: MainIndicator[];
  onSaved: (message: string) => void;
  onCancel: () => void;
}) {
  // A row keeps its number, so removing one leaves the others as typed.
  const [rows, setRows] = useState(() =>
    value.activities.map((text, id) => ({ id, text })),
  );
  const [ticked, setTicked] = useState(value.indicatorCodes);
  // Fixed when the form opens: the page may load a newer box while it is
  // open, and the save must still be checked against the box it shows.
  const [openedOn] = useState(value.version);

  function addRow() {
    const id = (rows.at(-1)?.id ?? -1) + 1;
    setRows([...rows, { id, text: "" }]);
  }

  async function save(before: FormState, form: FormData): Promise<FormState> {
    const after = await saveStageBreakdownAction(before, form);
    if (after.done) onSaved(after.done);
    return after;
  }

  const [state, action, pending] = useActionState(save, START);

  // Sent from here, not by the browser: the browser empties a sent form,
  // and what was typed must stay when the save is refused.
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(() => action(form));
  }

  return (
    <form onSubmit={send} className={`${styles.box} ${styles.breakdownForm}`}>
      <BreakdownTitle value={value} />
      <input type="hidden" name="tahap" value={tahapNo} />
      <input type="hidden" name="value" value={value.key} />
      <input type="hidden" name="version" value={openedOn} />
      <div className={styles.fields}>
        <label className={shared.field}>
          Penjabaran tugas
          <textarea
            name="text"
            className={shared.input}
            maxLength={TEXT_MAX_LENGTH}
            defaultValue={value.text}
          />
        </label>
        <fieldset className={`${shared.roles} ${styles.ticks}`}>
          <legend className={shared.label}>Kegiatan acuan</legend>
          {rows.map((row) => (
            <div key={row.id} className={styles.activityRow}>
              <input
                name="activity"
                aria-label="Kegiatan acuan"
                className={`${shared.input} ${styles.activityName}`}
                maxLength={ACTIVITY_MAX_LENGTH}
                defaultValue={row.text}
              />
              <button
                type="button"
                className={shared.link}
                onClick={() => setRows(rows.filter((kept) => kept !== row))}
              >
                Hapus
              </button>
            </div>
          ))}
          <div>
            <button type="button" className={shared.link} onClick={addRow}>
              Tambah kegiatan
            </button>
          </div>
        </fieldset>
        <fieldset className={`${shared.roles} ${styles.ticks}`}>
          <legend className={shared.label}>
            Indikator tahap (dari indikator utama {value.name})
          </legend>
          {indicators.map((indicator) => (
            <IndicatorTick
              key={indicator.code}
              indicator={indicator}
              levelNote={
                indicator.level === tahapNo ? " (level tahap ini)" : ""
              }
              checked={ticked.includes(indicator.code)}
              onToggle={(code) => setTicked(toggled(ticked, code))}
            />
          ))}
        </fieldset>
        {state.error && <FormMessage state={state} />}
        <div className={shared.actions}>
          <button type="submit" className={shared.button} disabled={pending}>
            Simpan
          </button>
          <button type="button" className={shared.quiet} onClick={onCancel}>
            Batal
          </button>
        </div>
      </div>
    </form>
  );
}
