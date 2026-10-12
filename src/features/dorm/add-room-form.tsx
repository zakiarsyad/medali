"use client";

import { type FormEvent, startTransition, useActionState, useRef } from "react";
import type { DormId } from "@/dorms/dorms";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { addRoomAction } from "./actions";
import {
  MAX_CAPACITY,
  MIN_CAPACITY,
  ROOM_NUMBER_MAX_LENGTH,
  START_CAPACITY,
} from "./room-limits";
import styles from "./rooms.module.css";

const START: FormState = { error: null, done: null };

export function AddRoomForm({ dorm, floor }: { dorm: DormId; floor: number }) {
  const fields = useRef<HTMLFormElement>(null);

  async function add(before: FormState, form: FormData): Promise<FormState> {
    const after = await addRoomAction(before, form);
    if (after.done) fields.current?.reset();
    return after;
  }

  const [state, save, pending] = useActionState(add, START);

  // Sent from here, not by the browser: the browser empties a sent form,
  // and a refused number must stay to be corrected.
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(() => save(form));
  }

  return (
    // noValidate: a wrong number or kapasitas gets the app's own message.
    <form ref={fields} onSubmit={send} className={styles.roomForm} noValidate>
      <input type="hidden" name="dorm" value={dorm} />
      <input type="hidden" name="floor" value={floor} />
      <label className={shared.field}>
        Nomor kamar
        <input
          name="number"
          className={shared.input}
          placeholder={`Misalnya ${floor}01 atau ${floor}A`}
          maxLength={ROOM_NUMBER_MAX_LENGTH}
        />
      </label>
      <label className={shared.field}>
        Kapasitas
        <input
          name="capacity"
          type="number"
          className={shared.input}
          min={MIN_CAPACITY}
          max={MAX_CAPACITY}
          defaultValue={START_CAPACITY}
        />
      </label>
      <button type="submit" className={shared.button} disabled={pending}>
        Tambah kamar di lantai {floor}
      </button>
      <FormMessage state={state} />
    </form>
  );
}
