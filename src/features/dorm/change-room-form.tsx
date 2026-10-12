"use client";

import { type FormEvent, startTransition, useActionState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { changeRoomAction } from "./actions";
import {
  MAX_CAPACITY,
  MIN_CAPACITY,
  ROOM_NUMBER_MAX_LENGTH,
} from "./room-limits";
import type { Room } from "./room-list";
import styles from "./rooms.module.css";

const START: FormState = { error: null, done: null };

export function ChangeRoomForm({ room }: { room: Room }) {
  const [state, save, pending] = useActionState(changeRoomAction, START);

  // Sent from here, not by the browser: the browser puts a sent form back
  // on its first values, and a refused one must stay to be corrected.
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(() => save(form));
  }

  return (
    <details>
      <summary className={shared.link}>Ubah nomor/kapasitas</summary>
      {/* noValidate: a wrong number or kapasitas gets the app's own message. */}
      <form onSubmit={send} className={styles.roomForm} noValidate>
        <input type="hidden" name="roomId" value={room.id} />
        <label className={shared.field}>
          Nomor kamar
          <input
            name="number"
            className={shared.input}
            defaultValue={room.number}
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
            defaultValue={room.capacity}
          />
        </label>
        <button type="submit" className={shared.button} disabled={pending}>
          Simpan
        </button>
        <FormMessage state={state} />
      </form>
    </details>
  );
}
