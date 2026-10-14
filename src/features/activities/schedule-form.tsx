"use client";

import { useActionState, useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { sendForm } from "@/ui/send-form";
import { saveScheduleAction } from "./actions";
import styles from "./activities.module.css";
import { ActivityFacts } from "./activity-facts";
import { ACTIVITY_FIELD_ID, ActivitySelect } from "./activity-select";
import {
  choicesWith,
  draftFor,
  type FormParts,
  keptChoice,
  participantsOn,
  startingValues,
  valuesOf,
} from "./form-values";
import { formTargetWords } from "./form-words";
import { ParticipantField } from "./participant-field";
import { RemoveScheduleButton } from "./remove-schedule-button";
import { LOCATION_MAX_LENGTH } from "./schedule-input";
import type { ScheduleRow } from "./schedule-row";
import { UploadRangeField } from "./upload-range-field";

const START: FormState = { error: null, done: null };

/** The heading of the form and the button that opens it for a new schedule. */
export function addWords(parts: Pick<FormParts, "extra">): string {
  return parts.extra
    ? "Jadwalkan kegiatan tambahan"
    : "Jadwalkan kegiatan PPKS";
}

/**
 * The form that schedules an activity of the Kurikulum list, PPKS or
 * special and additional with its Peserta, or changes a schedule, where
 * it also has "Hapus jadwal".
 */
export function ScheduleForm({
  schedule,
  parts,
  onSaved,
  onRemoved,
  onCancel,
}: {
  /** The schedule to change, or null to add a new one. */
  schedule: ScheduleRow | null;
  parts: FormParts;
  onSaved: (message: string) => void;
  onRemoved: (message: string) => void;
  onCancel: () => void;
}) {
  const start = schedule ? valuesOf(schedule) : startingValues(parts.today);
  const choices = choicesWith(parts.choices, schedule && keptChoice(schedule));
  const [activityId, setActivityId] = useState(start.activityId);
  const [startsOn, setStartsOn] = useState(start.startsOn);
  const [isRequired, setIsRequired] = useState(start.isRequired);
  // Kept as it was when the form opened: the page gets a new key whenever
  // it is read again, and two presses of "Simpan jadwal" must send the
  // same one.
  const [newId] = useState(parts.newScheduleId);
  const activity = choices.find((choice) => choice.id === activityId) ?? null;

  function choose(id: string) {
    setActivityId(id);
    const chosen = choices.find((choice) => choice.id === id);
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
      <h2 className={shared.heading}>
        {schedule ? "Ubah jadwal" : addWords(parts)}
      </h2>
      <input type="hidden" name="kind" value={parts.extra ? "extra" : "ppks"} />
      <input type="hidden" name="id" value={schedule?.id ?? newId} />
      {schedule && (
        <input type="hidden" name="version" value={schedule.version} />
      )}
      <div className={shared.form}>
        <label
          htmlFor={ACTIVITY_FIELD_ID}
          className={`${shared.field} ${styles.full} ${styles.fits}`}
        >
          Kegiatan dari Kurikulum
          <ActivitySelect
            choices={choices}
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
        {parts.extra ? (
          <ParticipantField
            start={draftFor(schedule, parts.extra)}
            pool={parts.extra.pool}
          />
        ) : (
          <p className={`${shared.detail} ${styles.full}`}>
            {formTargetWords(
              participantsOn(parts, activity, startsOn),
              activity?.targetParticipants ?? null,
            )}
          </p>
        )}
        {state.error && <FormMessage state={state} />}
        <div className={shared.actions}>
          <button type="submit" className={shared.button} disabled={pending}>
            {schedule ? "Simpan perubahan" : "Simpan jadwal"}
          </button>
          <button type="button" className={shared.quiet} onClick={onCancel}>
            Batal
          </button>
          {schedule && (
            <RemoveScheduleButton id={schedule.id} onRemoved={onRemoved} />
          )}
        </div>
      </div>
    </form>
  );
}
