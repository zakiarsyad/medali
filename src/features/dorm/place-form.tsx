"use client";

import { type ChangeEvent, useActionState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import type { Resident } from "./room-list";
import styles from "./rooms.module.css";

const START: FormState = { error: null, done: null };

function sendWhenChosen(event: ChangeEvent<HTMLSelectElement>) {
  if (event.target.value !== "") event.target.form?.requestSubmit();
}

/**
 * The choice of a resident or a kakak pendamping without a room, who moves
 * in once chosen.
 */
export function PlaceForm({
  action,
  what,
  roomId,
  roomNumber,
  offered,
}: {
  /** The change that puts the one chosen into the room. */
  action: (before: FormState, form: FormData) => Promise<FormState>;
  /** Who is chosen, as the screen says it. */
  what: "penghuni" | "kakak pendamping";
  roomId: string;
  roomNumber: string;
  /** Those of the dorm without a room that the screen offers. */
  offered: Resident[];
}) {
  const [state, send] = useActionState(action, START);
  return (
    <form action={send} className={styles.place}>
      <input type="hidden" name="roomId" value={roomId} />
      <select
        name="studentId"
        className={shared.input}
        defaultValue=""
        onChange={sendWhenChosen}
        aria-label={`Pilih ${what} untuk kamar ${roomNumber}`}
      >
        <option value="">Pilih {what}</option>
        {offered.map((resident) => (
          <option key={resident.id} value={resident.id}>
            {resident.name} ({resident.nim})
          </option>
        ))}
      </select>
      <FormMessage state={state} />
    </form>
  );
}
