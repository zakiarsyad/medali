"use client";

import { type ChangeEvent, useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { sendForm } from "@/ui/send-form";
import { useSaveState } from "@/ui/use-save-state";
import type { StoredEvaluation } from "./evaluated-group";
import { saveEvaluationAction } from "./evaluation-actions";
import {
  ASPECT_HINTS,
  ASPECT_TITLES,
  EVALUATION_ASPECTS,
  type EvaluationAspect,
  SCORE_MAX,
  SCORE_MIN,
} from "./evaluation-aspects";
import { typedFor } from "./evaluation-form-start";
import { NOTE_MAX_LENGTH } from "./evaluation-input";
import { EvaluationOutcome } from "./evaluation-outcome";
import styles from "./mentor-groups.module.css";

const START: FormState = { error: null, done: null };

/** A period the form offers, by the name the screens give it. */
export interface PeriodChoice {
  id: string;
  title: string;
}

function ScoreField({
  aspect,
  value,
  onType,
}: {
  aspect: EvaluationAspect;
  value: string;
  onType: (aspect: EvaluationAspect, value: string) => void;
}) {
  return (
    <label className={shared.field}>
      {ASPECT_TITLES[aspect]}
      <input
        name={aspect}
        type="number"
        inputMode="numeric"
        className={shared.input}
        min={SCORE_MIN}
        max={SCORE_MAX}
        step={1}
        value={value}
        onChange={(event) => onType(aspect, event.target.value)}
      />
      <small className={shared.detail}>{ASPECT_HINTS[aspect]}</small>
    </label>
  );
}

/**
 * The form of an evaluation for one group: the period, the four values,
 * the result they give, shown as they are typed, and the note. A period
 * that has an evaluation opens with it, so saving again corrects it. The
 * button is off while a save is on its way, so two presses save once.
 */
export function EvaluationForm({
  groupId,
  periods,
  stored,
}: {
  groupId: string;
  /** The periods that can be chosen, the running one first. */
  periods: PeriodChoice[];
  /** What is saved already for those periods. */
  stored: StoredEvaluation[];
}) {
  const [state, save, pending] = useSaveState(saveEvaluationAction, START);
  const [periodId, setPeriodId] = useState(periods[0]?.id ?? "");
  const [typed, setTyped] = useState(() => typedFor(stored, periodId));
  const isStored = stored.some((saved) => saved.periodId === periodId);

  function choosePeriod(event: ChangeEvent<HTMLSelectElement>) {
    setPeriodId(event.target.value);
    setTyped(typedFor(stored, event.target.value));
  }

  function typeScore(aspect: EvaluationAspect, value: string) {
    setTyped({ ...typed, scores: { ...typed.scores, [aspect]: value } });
  }

  return (
    // noValidate: the server names the aspect whose value is wrong.
    <form
      onSubmit={(event) => sendForm(event, save)}
      className={shared.form}
      noValidate
    >
      <input type="hidden" name="groupId" value={groupId} />
      <label className={`${shared.field} ${styles.whole}`}>
        Periode
        <select
          name="periodId"
          className={`${shared.input} ${styles.fit}`}
          value={periodId}
          onChange={choosePeriod}
        >
          {periods.map((period) => (
            <option key={period.id} value={period.id}>
              {period.title}
            </option>
          ))}
        </select>
        {isStored && (
          <small className={shared.detail}>
            Periode ini sudah dievaluasi. Menyimpan lagi memperbaiki
            evaluasinya.
          </small>
        )}
      </label>
      {EVALUATION_ASPECTS.map((aspect) => (
        <ScoreField
          key={aspect}
          aspect={aspect}
          value={typed.scores[aspect]}
          onType={typeScore}
        />
      ))}
      <div className={styles.whole}>
        <EvaluationOutcome typed={typed.scores} />
      </div>
      <label className={`${shared.field} ${styles.whole}`}>
        Catatan evaluasi
        <textarea
          name="note"
          className={shared.input}
          rows={3}
          maxLength={NOTE_MAX_LENGTH}
          placeholder="Temuan, umpan balik, dan rencana perbaikan"
          value={typed.note}
          onChange={(event) => setTyped({ ...typed, note: event.target.value })}
        />
      </label>
      <div className={shared.actions}>
        <button type="submit" className={shared.button} disabled={pending}>
          Simpan evaluasi
        </button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
