"use client";

import { useActionState, useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { sendForm } from "@/ui/send-form";
import { saveScheduleAction } from "./actions";
import styles from "./activities.module.css";
import { ActivityFacts } from "./activity-facts";
import { ACTIVITY_FIELD_ID, ActivitySelect } from "./activity-select";
import { type FormParts, participantsOn, startingValues } from "./form-values";
import { formTargetWords } from "./form-words";
import { LOCATION_MAX_LENGTH } from "./schedule-input";
import { UploadRangeField } from "./upload-range-field";

const START: FormState = { error: null, done: null };

/** The form that schedules a PPKS activity of the Kurikulum list. */
export function ScheduleForm({
  parts,
  onSaved,
  onCancel,
}: {
  parts: FormParts;
  onSaved: (message: string) => void;
  onCancel: () => void;
}) {
  const start = startingValues(parts.today);
  const [activityId, setActivityId] = useState(start.activityId);
  const [startsOn, setStartsOn] = useState(start.startsOn);
  const [isRequired, setIsRequired] = useState(start.isRequired);
  // Kept as it was when the form opened: the page gets a new key whenever
  // it is read again, and two presses of "Simpan jadwal" must send the
  // same one.
  const [newId] = useState(parts.newScheduleId);
  const activity =
    parts.choices.find((choice) => choice.id === activityId) ?? null;

  function choose(id: string) {
    setActivityId(id);
    const chosen = parts.choices.find((choice) => choice.id === id);
    if (chosen) setIsRequired(chosen.isRequired);
  }

  async function save(before: FormState, form: FormData): Promise<FormState> {
    const after = await saveScheduleAction(before, form);
    if (after.done) onSaved(after.done);
    return after;
  }

  const [state, action, pending] = useActionState(save, START);

  return (
    // noValidate: the server says what is wrong, in the app's own words.
    <form onSubmit={(event) => sendForm(event, action)} noValidate>
      <h2 className={shared.heading}>Jadwalkan kegiatan PPKS</h2>
      <input type="hidden" name="id" value={newId} />
      <div className={shared.form}>
        <label
          htmlFor={ACTIVITY_FIELD_ID}
          className={`${shared.field} ${styles.full} ${styles.fits}`}
        >
          Kegiatan dari Kurikulum
          <ActivitySelect
            choices={parts.choices}
            chosenId={activityId}
            onChoose={choose}
          />
        </label>
        {activity && <ActivityFacts activity={activity} />}
        <label className={shared.field}>
          Tanggal mulai
          <input
            name="startsOn"
            type="date"
            className={shared.input}
            value={startsOn}
            onChange={(event) => setStartsOn(event.target.value)}
          />
        </label>
        <label className={shared.field}>
          Tanggal selesai
          <input
            name="endsOn"
            type="date"
            className={shared.input}
            defaultValue={start.endsOn}
          />
        </label>
        <label className={shared.field}>
          Jam mulai
          <input
            name="startTime"
            type="time"
            className={shared.input}
            defaultValue={start.startTime}
          />
        </label>
        <label className={shared.field}>
          Jam selesai
          <input
            name="endTime"
            type="time"
            className={shared.input}
            defaultValue={start.endTime}
          />
        </label>
        <UploadRangeField count={start.uploadCount} unit={start.uploadUnit} />
        <label className={shared.field}>
          Lokasi
          <input
            name="location"
            className={shared.input}
            maxLength={LOCATION_MAX_LENGTH}
            defaultValue={start.location}
          />
        </label>
        <label className={shared.role}>
          <input
            type="checkbox"
            name="required"
            checked={isRequired}
            onChange={(event) => setIsRequired(event.target.checked)}
          />
          Wajib, dihitung dalam nilai kehadiran
        </label>
        <p className={`${shared.detail} ${styles.full}`}>
          {formTargetWords(
            participantsOn(parts, activity, startsOn),
            activity?.targetParticipants ?? null,
          )}
        </p>
        {state.error && <FormMessage state={state} />}
        <div className={shared.actions}>
          <button type="submit" className={shared.button} disabled={pending}>
            Simpan jadwal
          </button>
          <button type="button" className={shared.quiet} onClick={onCancel}>
            Batal
          </button>
        </div>
      </div>
    </form>
  );
}
