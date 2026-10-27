"use client";

import { type FormEvent, startTransition, useRef } from "react";
import { DORM_IDS, DORM_NAMES, type DormId } from "@/dorms/dorms";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { useSaveState } from "@/ui/use-save-state";
import { addCleaningPlaceAction } from "./cleaning-actions";
import { PLACE_NAME_MAX_LENGTH } from "./cleaning-ids";

const START: FormState = { error: null, done: null };

/** The form "Tambah tempat": a name and the dorm it belongs to. */
export function AddPlaceForm({ formDorm }: { formDorm: DormId }) {
  const fields = useRef<HTMLFormElement>(null);

  async function add(before: FormState, form: FormData): Promise<FormState> {
    const after = await addCleaningPlaceAction(before, form);
    if (after.done) fields.current?.reset();
    return after;
  }

  const [state, save, pending] = useSaveState(add, START);

  // Sent from here, not by the browser: the browser empties a sent form,
  // and a refused name must stay to be corrected.
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(() => save(form));
  }

  return (
    <form ref={fields} onSubmit={send} className={shared.form} noValidate>
      <label className={shared.field}>
        Nama tempat baru
        <input
          name="name"
          className={shared.input}
          placeholder="Misalnya Musala atau Koridor lantai 2"
          maxLength={PLACE_NAME_MAX_LENGTH}
        />
      </label>
      <label className={shared.field}>
        Asrama
        <select
          // Made anew for each dorm picked above, so it starts on that one.
          key={formDorm}
          name="dorm"
          className={shared.input}
          defaultValue={formDorm}
        >
          {DORM_IDS.map((id) => (
            <option key={id} value={id}>
              {DORM_NAMES[id]}
            </option>
          ))}
        </select>
      </label>
      <div className={shared.actions}>
        <button type="submit" className={shared.button} disabled={pending}>
          Tambah tempat
        </button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
