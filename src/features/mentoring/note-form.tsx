"use client";

import { type ChangeEvent, useActionState, useState } from "react";
import { FOLLOW_UPS, NOTE_KINDS, type NoteKind } from "@/mentoring/note-ids";
import { FOLLOW_UP_TITLES, KIND_TITLES } from "@/mentoring/note-words";
import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import { MEDALI_VALUES, type ValueKey } from "@/ui/medali-values";
import { sendForm } from "@/ui/send-form";
import { ValueSwatch } from "@/ui/value-swatch";
import { saveNoteAction } from "./actions";
import { MenteePicker } from "./mentee-picker";
import type { Mentee } from "./mentees";
import styles from "./mentoring.module.css";
import type { NoteFormState } from "./note-form-state";
import { NOTE_MAX_LENGTH } from "./note-input";
import { isNoteKind, KIND_VALUES } from "./note-kinds";

const FIRST_KIND: NoteKind = NOTE_KINDS[0];

function ValueTicks({
  ticked,
  onTick,
}: {
  ticked: readonly ValueKey[];
  onTick: (value: ValueKey, isTicked: boolean) => void;
}) {
  return (
    <fieldset className={`${shared.roles} ${styles.whole}`}>
      <legend className={shared.label}>Nilai yang terkait</legend>
      {MEDALI_VALUES.map((value) => (
        <label key={value.key} className={shared.role}>
          <input
            type="checkbox"
            name="valueKeys"
            value={value.key}
            checked={ticked.includes(value.key)}
            onChange={(event) => onTick(value.key, event.target.checked)}
          />
          <ValueSwatch value={value.key} />
          {value.name}
        </label>
      ))}
    </fieldset>
  );
}

/**
 * The form "Catatan baru". Choosing a kind ticks the values that go with
 * it, and the mentor is free to change them. After a save the text is
 * emptied and the rest stays, for the next note. The button is off while
 * a save is on its way, and the form sends the key of its note, so two
 * presses save once.
 */
export function NoteForm({
  mentees,
  startWith,
  today,
  noteId,
}: {
  /** The students the mentor may write for. */
  mentees: Mentee[];
  /** The mentee the form opens with, if the address asked for one. */
  startWith: Mentee | null;
  /** Today on campus: where Tanggal starts, and the last day it takes. */
  today: string;
  /** The key of the first note this form sends. */
  noteId: string;
}) {
  const [chosen, setChosen] = useState(startWith);
  const [kind, setKind] = useState<NoteKind>(FIRST_KIND);
  const [ticked, setTicked] = useState<readonly ValueKey[]>(
    KIND_VALUES[FIRST_KIND],
  );
  const [note, setNote] = useState("");

  async function send(
    before: NoteFormState,
    form: FormData,
  ): Promise<NoteFormState> {
    const after = await saveNoteAction(before, form);
    if (after.done) setNote("");
    return after;
  }

  const start: NoteFormState = { error: null, done: null, noteId };
  const [state, save, pending] = useActionState(send, start);

  function chooseKind(event: ChangeEvent<HTMLSelectElement>) {
    if (!isNoteKind(event.target.value)) return;
    setKind(event.target.value);
    setTicked(KIND_VALUES[event.target.value]);
  }

  function tick(value: ValueKey, isTicked: boolean) {
    const others = ticked.filter((key) => key !== value);
    setTicked(isTicked ? [...others, value] : others);
  }

  return (
    // noValidate: the server says what is missing, in the app's own words.
    <form
      onSubmit={(event) => sendForm(event, save)}
      className={shared.form}
      noValidate
    >
      <input type="hidden" name="id" value={state.noteId} />
      <div className={styles.whole}>
        <MenteePicker mentees={mentees} chosen={chosen} onChoose={setChosen} />
      </div>
      <label className={shared.field}>
        Jenis kegiatan
        <select
          name="kind"
          className={`${shared.input} ${styles.fit}`}
          value={kind}
          onChange={chooseKind}
        >
          {NOTE_KINDS.map((each) => (
            <option key={each} value={each}>
              {KIND_TITLES[each]}
            </option>
          ))}
        </select>
      </label>
      <label className={shared.field}>
        Tanggal
        <input
          name="happenedOn"
          type="date"
          className={shared.input}
          defaultValue={today}
          max={today}
        />
      </label>
      <ValueTicks ticked={ticked} onTick={tick} />
      <label className={`${shared.field} ${styles.whole}`}>
        Catatan
        <textarea
          name="note"
          className={shared.input}
          rows={4}
          maxLength={NOTE_MAX_LENGTH}
          placeholder="Apa yang dibahas atau diamati, dan bagaimana respons mahasiswa?"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      <label className={`${shared.field} ${styles.whole}`}>
        Tindak lanjut
        <select
          name="followUp"
          className={`${shared.input} ${styles.fit}`}
          defaultValue={FOLLOW_UPS[0]}
        >
          {FOLLOW_UPS.map((each) => (
            <option key={each} value={each}>
              {FOLLOW_UP_TITLES[each]}
            </option>
          ))}
        </select>
      </label>
      <div className={shared.actions}>
        <button type="submit" className={shared.button} disabled={pending}>
          Simpan catatan
        </button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
