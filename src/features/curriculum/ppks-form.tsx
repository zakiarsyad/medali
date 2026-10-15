"use client";

import {
  type FormEvent,
  startTransition,
  useActionState,
  useState,
} from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import type { ValueKey } from "@/ui/medali-values";
import { ValueSwatch } from "@/ui/value-swatch";
import { savePpksActivityAction } from "./actions";
import styles from "./curriculum.module.css";
import type { ValueIndicators } from "./main-indicators";
import {
  type PpksActivity,
  ticksOfValues,
  toggled,
  wordsOf,
} from "./ppks-activities";
import { DESCRIPTION_MAX_LENGTH, NAME_MAX_LENGTH } from "./ppks-activity-input";
import { PpksIndicatorTicks } from "./ppks-indicator-ticks";
import { RemovePpksButton } from "./remove-ppks-button";

const START: FormState = { error: null, done: null };

/**
 * What Target peserta starts with. A new activity starts with the number
 * the app would fill in, so saving it keeps that number as a typed one.
 * A 0 is left out: saved as typed, it would stay 0 once students are
 * counted. An activity without a target stays empty, so saving it keeps
 * the number filled in by the app.
 */
function startingTarget(
  activity: PpksActivity | null,
  autoTarget: number | null,
): number | "" {
  if (activity) return activity.targetParticipants ?? "";
  if (autoTarget === null || autoTarget === 0) return "";
  return autoTarget;
}

/**
 * The form that adds an activity or changes one: a PPKS activity of one
 * semester, or a special or additional one, which has no semester.
 */
export function PpksForm({
  semester,
  activity,
  newActivityId,
  autoTarget,
  values,
  onSaved,
  onRemoved,
  onCancel,
}: {
  semester: number | null;
  /** The activity to change, or null to add a new one. */
  activity: PpksActivity | null;
  /** The key of the activity this form adds, so two presses add it once. */
  newActivityId: string;
  /** The target the app fills in for this list, or null for none. */
  autoTarget: number | null;
  /** Every nilai with its main indicators as they are now. */
  values: ValueIndicators[];
  onSaved: (message: string) => void;
  /** Told the message of the removal and which activity was removed. */
  onRemoved: (message: string, id: string) => void;
  onCancel: () => void;
}) {
  const [chosen, setChosen] = useState<ValueKey[]>(activity?.valueKeys ?? []);
  const [ticked, setTicked] = useState(activity?.indicatorCodes ?? []);
  // Kept as it was when the form opened: the page gets a new key whenever
  // it is read again, and two presses of "Simpan" must send the same one.
  const [newId] = useState(newActivityId);

  function toggleValue(key: ValueKey) {
    const left = toggled(chosen, key);
    setChosen(left);
    setTicked(ticksOfValues(ticked, left));
  }

  async function save(before: FormState, form: FormData): Promise<FormState> {
    const after = await savePpksActivityAction(before, form);
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
    // noValidate: a wrong target gets the app's own message.
    <form
      onSubmit={send}
      className={`${styles.box} ${styles.activityForm}`}
      noValidate
    >
      <h3 className={styles.boxTitle}>
        {activity ? "Ubah kegiatan" : wordsOf(semester).newTitle}
      </h3>
      <input type="hidden" name="semester" value={semester ?? ""} />
      <input type="hidden" name="id" value={activity?.id ?? newId} />
      {activity && (
        <input type="hidden" name="version" value={activity.version} />
      )}
      <div className={shared.form}>
        <label className={`${shared.field} ${styles.full}`}>
          Nama kegiatan
          <input
            name="name"
            className={shared.input}
            maxLength={NAME_MAX_LENGTH}
            defaultValue={activity?.name}
          />
        </label>
        <fieldset className={shared.roles}>
          <legend className={shared.label}>Nilai MEDALI</legend>
          {values.map(({ key, name }) => (
            <label key={key} className={shared.role}>
              <input
                type="checkbox"
                name="value"
                value={key}
                checked={chosen.includes(key)}
                onChange={() => toggleValue(key)}
              />
              <ValueSwatch value={key} />
              {name}
            </label>
          ))}
        </fieldset>
        <fieldset className={`${shared.roles} ${styles.ticks}`}>
          <legend className={shared.label}>Indikator utama yang dituju</legend>
          <PpksIndicatorTicks
            values={values.filter((value) => chosen.includes(value.key))}
            semester={semester}
            ticked={ticked}
            onToggle={(code) => setTicked(toggled(ticked, code))}
          />
        </fieldset>
        <label className={shared.field}>
          Target peserta
          <input
            name="target"
            type="number"
            min={0}
            className={shared.input}
            defaultValue={startingTarget(activity, autoTarget)}
          />
        </label>
        <label className={shared.role}>
          <input
            type="checkbox"
            name="required"
            defaultChecked={activity?.isRequired ?? true}
          />
          Wajib, dihitung dalam nilai kehadiran
        </label>
        <label className={`${shared.field} ${styles.full}`}>
          Deskripsi
          <textarea
            name="description"
            className={shared.input}
            maxLength={DESCRIPTION_MAX_LENGTH}
            defaultValue={activity?.description}
          />
        </label>
        {state.error && <FormMessage state={state} />}
        <div className={shared.actions}>
          <button type="submit" className={shared.button} disabled={pending}>
            Simpan
          </button>
          <button type="button" className={shared.quiet} onClick={onCancel}>
            Batal
          </button>
          {activity && (
            <RemovePpksButton
              id={activity.id}
              name={activity.name}
              onRemoved={(message) => onRemoved(message, activity.id)}
            />
          )}
        </div>
      </div>
      <p className={`${shared.detail} ${styles.formNote}`}>
        Tanggal dan jam pelaksanaan diatur di menu Kegiatan karakter.
      </p>
    </form>
  );
}
