"use client";

import { useRef } from "react";
import type { StudyProgram } from "@/db/study-programs";
import styles from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { sendForm } from "@/ui/send-form";
import { useSaveState } from "@/ui/use-save-state";
import {
  NAME_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  UNIT_MAX_LENGTH,
} from "./account-limits";
import { addAccountAction } from "./actions";
import { ProgramChoice, RoleChoices } from "./role-choices";

const START: FormState = { error: null, done: null };

export function AddAccountForm({ programs }: { programs: StudyProgram[] }) {
  const fields = useRef<HTMLFormElement>(null);

  async function add(before: FormState, form: FormData): Promise<FormState> {
    const after = await addAccountAction(before, form);
    if (after.done) fields.current?.reset();
    return after;
  }

  const [state, save, pending] = useSaveState(add, START);

  return (
    <details className={styles.panel}>
      <summary className={styles.button}>Tambah pengguna</summary>
      {/* noValidate: a short name or a wrong email gets the app's own message. */}
      <form
        ref={fields}
        onSubmit={(event) => sendForm(event, save)}
        className={styles.form}
        noValidate
      >
        <h2 className={styles.heading}>Pengguna baru</h2>
        <label className={styles.field}>
          Nama lengkap
          <input
            name="name"
            className={styles.input}
            required
            minLength={3}
            maxLength={NAME_MAX_LENGTH}
          />
        </label>
        <label className={styles.field}>
          Gelar
          <input
            name="title"
            className={styles.input}
            placeholder="Misalnya S.E., M.Ak."
            maxLength={TITLE_MAX_LENGTH}
          />
        </label>
        <label className={styles.field}>
          NIP
          <input
            name="nip"
            className={styles.input}
            inputMode="numeric"
            maxLength={18}
          />
        </label>
        <label className={styles.field}>
          Email kedinasan
          <input
            name="email"
            type="email"
            className={styles.input}
            placeholder="nama@pknstan.ac.id"
            required
          />
        </label>
        <RoleChoices chosen={[]} />
        <ProgramChoice programs={programs} chosen={null} />
        <label className={styles.field}>
          Unit atau jabatan
          <input
            name="unit"
            className={styles.input}
            defaultValue="Unit Pembangunan Karakter"
            maxLength={UNIT_MAX_LENGTH}
          />
        </label>
        <FormMessage state={state} />
        <div className={styles.actions}>
          <button type="submit" className={styles.button} disabled={pending}>
            Simpan pengguna
          </button>
        </div>
      </form>
    </details>
  );
}
