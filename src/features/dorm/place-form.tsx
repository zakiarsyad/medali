"use client";

import { type ChangeEvent, useActionState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { placeResidentAction } from "./actions";
import type { Resident } from "./room-list";
import styles from "./rooms.module.css";

const START: FormState = { error: null, done: null };

function sendWhenChosen(event: ChangeEvent<HTMLSelectElement>) {
  if (event.target.value !== "") event.target.form?.requestSubmit();
}

/** The choice of a resident without a room, who moves in once chosen. */
export function PlaceForm({
  roomId,
  roomNumber,
  offered,
}: {
  roomId: string;
  roomNumber: string;
  /** The residents of the dorm without a room that the screen lists. */
  offered: Resident[];
}) {
  const [state, send] = useActionState(placeResidentAction, START);
  return (
    <form action={send} className={styles.place}>
      <input type="hidden" name="roomId" value={roomId} />
      <select
        name="studentId"
        className={shared.input}
        defaultValue=""
        onChange={sendWhenChosen}
        aria-label={`Pilih penghuni untuk kamar ${roomNumber}`}
      >
        <option value="">Pilih penghuni</option>
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
