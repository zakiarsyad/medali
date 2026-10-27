"use client";

import {
  type ChangeEvent,
  type FormEvent,
  startTransition,
  useRef,
  useState,
} from "react";
import { DORM_NAMES } from "@/dorms/dorms";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { useSaveState } from "@/ui/use-save-state";
import { nameCompanionAction } from "./companion-actions";
import type { Candidate } from "./companion-candidates";
import {
  COMPANION_DORM_IDS,
  type CompanionDormId,
  companionDormOf,
} from "./companion-dorms";
import { NOTE_MAX_LENGTH } from "./companion-limits";

const START: FormState = { error: null, done: null };
const FIRST_DORM: CompanionDormId = "dana_rakca";

/** The form "Tetapkan kakak pendamping". */
export function NameCompanionForm({
  offered,
}: {
  /** The students who can be named that the search found. */
  offered: Candidate[];
}) {
  const fields = useRef<HTMLFormElement>(null);
  const [dorm, setDorm] = useState<string>(FIRST_DORM);

  async function name(before: FormState, form: FormData): Promise<FormState> {
    const after = await nameCompanionAction(before, form);
    if (after.done) fields.current?.reset();
    return after;
  }

  const [state, save, pending] = useSaveState(name, START);

  /** Sets Asrama from the jenis kelamin of the student chosen. */
  function followStudent(event: ChangeEvent<HTMLSelectElement>) {
    const chosen = offered.find((one) => one.id === event.target.value);
    if (chosen) setDorm(companionDormOf(chosen.sex));
  }

  // Sent from here, not by the browser: the browser empties a sent form,
  // and a refused choice must stay to be corrected.
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(() => save(form));
  }

  return (
    <form ref={fields} onSubmit={send} className={shared.form} noValidate>
      <label className={shared.field}>
        Mahasiswa
        <select
          name="studentId"
          className={shared.input}
          defaultValue=""
          onChange={followStudent}
        >
          <option value="">Pilih mahasiswa</option>
          {offered.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name} ({student.nim})
            </option>
          ))}
        </select>
      </label>
      <label className={shared.field}>
        Asrama
        <select
          name="dorm"
          className={shared.input}
          value={dorm}
          onChange={(event) => setDorm(event.target.value)}
        >
          {COMPANION_DORM_IDS.map((id) => (
            <option key={id} value={id}>
              {DORM_NAMES[id]}
            </option>
          ))}
        </select>
      </label>
      <label className={shared.field}>
        Keterangan
        <input
          name="note"
          className={shared.input}
          placeholder="Misalnya pendamping lantai 3"
          maxLength={NOTE_MAX_LENGTH}
        />
      </label>
      <div className={shared.actions}>
        <button type="submit" className={shared.button} disabled={pending}>
          Tetapkan
        </button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
