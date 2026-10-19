"use client";

import {
  type ChangeEvent,
  type FormEvent,
  startTransition,
  useActionState,
  useRef,
  useState,
} from "react";
import { DORM_IDS, DORM_NAMES, DORM_SEXES, type DormId } from "@/dorms/dorms";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import type { NonResident } from "./non-residents";
import { addResidentAction } from "./resident-actions";
import { ADDED_NOTE_MAX_LENGTH } from "./room-limits";

const START: FormState = { error: null, done: null };

/** The dorms that fit a jenis kelamin, in the order the screens show them. */
function dormsFor(sex: NonResident["sex"]): DormId[] {
  return DORM_IDS.filter((dorm) => DORM_SEXES[dorm] === sex);
}

/** The form "Tambah penghuni". */
export function AddResidentForm({
  offered,
  openDorm,
}: {
  /** The students who live in no dorm that the search found. */
  offered: NonResident[];
  /** The dorm open on the screen, offered first when it fits. */
  openDorm: DormId;
}) {
  const fields = useRef<HTMLFormElement>(null);
  const [chosen, setChosen] = useState<NonResident | null>(null);
  const [dorm, setDorm] = useState<string>("");

  async function add(before: FormState, form: FormData): Promise<FormState> {
    const after = await addResidentAction(before, form);
    if (after.done) {
      fields.current?.reset();
      setChosen(null);
      setDorm("");
    }
    return after;
  }

  const [state, save, pending] = useActionState(add, START);

  /** Offers the dorms of the jenis kelamin of the student chosen. */
  function followStudent(event: ChangeEvent<HTMLSelectElement>) {
    const student = offered.find((one) => one.id === event.target.value);
    setChosen(student ?? null);
    const fitting = student ? dormsFor(student.sex) : [];
    setDorm(fitting.includes(openDorm) ? openDorm : (fitting[0] ?? ""));
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
          disabled={chosen === null}
        >
          {chosen === null && <option value="">Pilih mahasiswa dulu</option>}
          {chosen &&
            dormsFor(chosen.sex).map((id) => (
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
          placeholder="Misalnya alasan tinggal di asrama"
          maxLength={ADDED_NOTE_MAX_LENGTH}
        />
      </label>
      <div className={shared.actions}>
        <button type="submit" className={shared.button} disabled={pending}>
          Simpan
        </button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
