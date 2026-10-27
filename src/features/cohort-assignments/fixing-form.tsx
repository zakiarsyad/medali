"use client";

import { useRef, useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { refusedSave, sentOr } from "@/ui/save-not-sent";
import { isToldAbove } from "./answer-place";
import { changeForm } from "./change-form";
import styles from "./cohort-assignments.module.css";
import { decreeStepAction } from "./decree-actions";
import {
  ASK_FOR_NUMBER,
  DECREE_NUMBER_MAX,
  type DecreeStep,
  type WholeDecree,
  wholeDecree,
} from "./decree-input";
import type { DraftKey } from "./draft-change-input";
import { type FixSize, fixQuestion } from "./fix-words";
import { useOneSave } from "./one-save";

const START: FormState = { error: null, done: null };

/**
 * The fields and buttons of "4. Penetapan". "Simpan draf" saves the
 * number and the day. An account that may fix gets "Tetapkan", which asks
 * for the number first and then asks to be sure; any other gets "Ajukan
 * ke Kepala UPK". Both stay off while the draft is not complete, which
 * the server checks again.
 */
export function FixingForm({
  shown,
  start,
  size,
  isComplete,
  mayFix,
}: {
  /** The draft the form is shown with. */
  shown: DraftKey;
  /** What the fields open with: what the draft holds, the day never empty. */
  start: WholeDecree;
  size: FixSize;
  /** Whether nothing in the note of step 3 holds the draft back. */
  isComplete: boolean;
  mayFix: boolean;
}) {
  const { isSaving, save, announce } = useOneSave();
  const [decreeNumber, setDecreeNumber] = useState(start.decreeNumber);
  const [effectiveOn, setEffectiveOn] = useState(start.effectiveOn);
  const [answer, setAnswer] = useState(START);
  const [held, setHeld] = useState(start);
  const numberField = useRef<HTMLInputElement>(null);
  const isOff = isSaving || !isComplete;

  // When the draft comes back holding another number or day, someone else
  // saved them: the fields show those, or "Simpan draf" from here would
  // put the older ones back without anyone seeing it.
  const holdsOther =
    held.decreeNumber !== start.decreeNumber ||
    held.effectiveOn !== start.effectiveOn;
  if (holdsOther) {
    setHeld(start);
    setDecreeNumber(start.decreeNumber);
    setEffectiveOn(start.effectiveOn);
  }

  function take(step: DecreeStep) {
    const form = changeForm(shown, { step, decreeNumber, effectiveOn });
    save(async () => {
      const after = await sentOr(() => decreeStepAction(form), refusedSave);
      if (isToldAbove(step, after)) {
        announce(after);
        return;
      }
      setAnswer(after);
    });
  }

  function fix() {
    const decree = wholeDecree({ decreeNumber, effectiveOn });
    if (!decree.ok) {
      setAnswer({ error: decree.error, done: null });
      if (decree.error === ASK_FOR_NUMBER) numberField.current?.focus();
      return;
    }
    if (!window.confirm(fixQuestion(size, decree.value.effectiveOn))) return;
    take("fix");
  }

  return (
    <div className={shared.form}>
      <label className={shared.field}>
        Nomor surat keputusan
        <input
          ref={numberField}
          className={shared.input}
          value={decreeNumber}
          maxLength={DECREE_NUMBER_MAX}
          placeholder="Misalnya KEP-12/PKN/2026"
          onChange={(event) => setDecreeNumber(event.target.value)}
        />
      </label>
      <label className={shared.field}>
        Berlaku mulai
        <input
          type="date"
          className={shared.input}
          value={effectiveOn}
          onChange={(event) => setEffectiveOn(event.target.value)}
        />
      </label>
      <div className={shared.actions}>
        <button
          type="button"
          className={shared.quiet}
          disabled={isSaving}
          onClick={() => take("save")}
        >
          Simpan draf
        </button>
        {mayFix ? (
          <button
            type="button"
            className={shared.button}
            disabled={isOff}
            onClick={fix}
          >
            Tetapkan
          </button>
        ) : (
          <button
            type="button"
            className={shared.button}
            disabled={isOff}
            onClick={() => take("submit")}
          >
            Ajukan ke Kepala UPK
          </button>
        )}
      </div>
      {!isComplete && (
        <p className={`${styles.hint} ${styles.whole}`}>
          {mayFix ? "Tetapkan" : "Ajukan ke Kepala UPK"} bisa ditekan setelah
          semua yang disebut pada catatan di langkah 3 diselesaikan.
        </p>
      )}
      <FormMessage state={answer} />
    </div>
  );
}
