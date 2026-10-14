"use client";

import { type ReactNode, useActionState, useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { sendForm } from "@/ui/send-form";
import styles from "./activities.module.css";
import { saveActivityAction } from "./activity-actions";
import {
  ACTIVITY_CATEGORIES,
  AUDIENCES,
  ONE_OFF,
  ORGANISERS,
} from "./activity-ids";
import {
  LOCATION_MAX_LENGTH,
  NAME_MAX_LENGTH,
  ORGANISER_NAME_MAX_LENGTH,
} from "./activity-limits";
import type { ActivityRow } from "./activity-row";
import {
  audienceWords,
  CATEGORY_WORDS,
  ORGANISER_NAMES,
} from "./activity-words";
import { changeStart, type FormStart, newStart } from "./form-start";
import { PatternFields } from "./pattern-fields";
import { RundownField } from "./rundown-field";

const START: FormState = { error: null, done: null };

/** What the activity form is open for. */
export interface FormTarget {
  isRoutine: boolean;
  /** The activity to change, or null to add a new one. */
  activity: ActivityRow | null;
}

function headingOf({ isRoutine, activity }: FormTarget): string {
  const kind = isRoutine ? "rutin" : "non rutin";
  return activity ? `Ubah kegiatan ${kind}` : `Kegiatan ${kind} baru`;
}

function TextField({
  label,
  name,
  start,
  maxLength,
  placeholder,
  isFull = false,
}: {
  label: string;
  name: string;
  start: string;
  maxLength: number;
  placeholder?: string;
  isFull?: boolean;
}) {
  return (
    <label className={`${shared.field} ${isFull ? styles.full : ""}`}>
      {label}
      <input
        name={name}
        className={shared.input}
        maxLength={maxLength}
        placeholder={placeholder}
        defaultValue={start}
      />
    </label>
  );
}

function ChoiceField<T extends string>({
  label,
  name,
  start,
  choices,
  wordsOf,
}: {
  label: string;
  name: string;
  start: T;
  choices: readonly T[];
  wordsOf: (choice: T) => string;
}) {
  return (
    <label className={`${shared.field} ${styles.fits}`}>
      {label}
      <select name={name} className={shared.input} defaultValue={start}>
        {choices.map((choice) => (
          <option key={choice} value={choice}>
            {wordsOf(choice)}
          </option>
        ))}
      </select>
    </label>
  );
}

function TimeField({
  label,
  name,
  start,
}: {
  label: string;
  name: string;
  start: string;
}) {
  return (
    <label className={shared.field}>
      {label}
      <input
        name={name}
        type="time"
        className={shared.input}
        defaultValue={start}
      />
    </label>
  );
}

/** The fields that say when it takes place: a pattern, or one Tanggal. */
function DaysFields({
  isRoutine,
  start,
}: {
  isRoutine: boolean;
  start: FormStart;
}) {
  if (isRoutine) return <PatternFields start={start} />;
  return (
    <label className={shared.field}>
      <input type="hidden" name="pattern" value={ONE_OFF} />
      Tanggal
      <input
        name="day"
        type="date"
        className={shared.input}
        defaultValue={start.day}
      />
    </label>
  );
}

/**
 * The form that adds a repeating or a one-off dorm activity, or changes
 * one. `removal` is what the form of a change offers to remove it.
 */
export function ActivityForm({
  target,
  newActivityId,
  day,
  onSaved,
  onCancel,
  removal,
}: {
  target: FormTarget;
  /** The key a new activity is added under. */
  newActivityId: string;
  /** The day a new activity starts on: the one open in Jadwal harian. */
  day: string;
  onSaved: (message: string) => void;
  onCancel: () => void;
  removal: ReactNode;
}) {
  const { activity, isRoutine } = target;
  const start = activity ? changeStart(activity) : newStart(day);
  // Kept as it was when the form opened: the page gets a new key whenever
  // it is read again, and two presses of "Simpan kegiatan" must send the
  // same one.
  const [newId] = useState(newActivityId);

  async function save(before: FormState, form: FormData): Promise<FormState> {
    const after = await saveActivityAction(before, form);
    if (after.done) onSaved(after.done);
    return after;
  }

  const [state, action, pending] = useActionState(save, START);

  return (
    // noValidate: the server says what is wrong, in the app's own words.
    <form onSubmit={(event) => sendForm(event, action)} noValidate>
      <h2 className={shared.heading}>{headingOf(target)}</h2>
      <input type="hidden" name="id" value={activity?.id ?? newId} />
      {activity && (
        <input type="hidden" name="version" value={activity.version} />
      )}
      <div className={shared.form}>
        <TextField
          label="Nama kegiatan"
          name="name"
          start={start.name}
          maxLength={NAME_MAX_LENGTH}
          isFull
        />
        <ChoiceField
          label="Kategori"
          name="category"
          start={start.category}
          choices={ACTIVITY_CATEGORIES}
          wordsOf={(category) => CATEGORY_WORDS[category]}
        />
        <TextField
          label="Lokasi"
          name="location"
          start={start.location}
          maxLength={LOCATION_MAX_LENGTH}
        />
        <DaysFields isRoutine={isRoutine} start={start} />
        <TimeField label="Mulai" name="startTime" start={start.startTime} />
        <TimeField label="Selesai" name="endTime" start={start.endTime} />
        <ChoiceField
          label="Penanggung jawab"
          name="organiser"
          start={start.organiser}
          choices={ORGANISERS}
          wordsOf={(organiser) => ORGANISER_NAMES[organiser]}
        />
        <TextField
          label="Nama penanggung jawab"
          name="organiserName"
          start={start.organiserName}
          maxLength={ORGANISER_NAME_MAX_LENGTH}
          placeholder="Nama orang atau tim"
        />
        <ChoiceField
          label="Peserta"
          name="audience"
          start={start.audience}
          choices={AUDIENCES}
          wordsOf={audienceWords}
        />
        <label className={shared.role}>
          <input
            type="checkbox"
            name="required"
            defaultChecked={start.isRequired}
          />
          Wajib hadir
        </label>
        <RundownField start={start.rundown} />
        {state.error && <FormMessage state={state} />}
        <div className={shared.actions}>
          <button type="submit" className={shared.button} disabled={pending}>
            {activity ? "Simpan perubahan" : "Simpan kegiatan"}
          </button>
          <button type="button" className={shared.quiet} onClick={onCancel}>
            Batal
          </button>
          {removal}
        </div>
      </div>
    </form>
  );
}
