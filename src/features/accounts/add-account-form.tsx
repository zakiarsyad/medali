"use client";

import { useActionState } from "react";
import type { StudyProgram } from "@/db/study-programs";
import styles from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { addAccountAction } from "./actions";
import { ProgramChoice, RoleChoices } from "./role-choices";

const START: FormState = { error: null, done: null };

export function AddAccountForm({ programs }: { programs: StudyProgram[] }) {
  const [state, action, pending] = useActionState(addAccountAction, START);
  return (
    <details className={styles.panel}>
      <summary className={styles.button}>Tambah pengguna</summary>
      <form action={action} className={styles.form}>
        <h2 className={styles.heading}>Pengguna baru</h2>
        <label className={styles.field}>
          Nama lengkap
          <input name="name" className={styles.input} required minLength={3} />
        </label>
        <label className={styles.field}>
          Gelar
          <input
            name="title"
            className={styles.input}
            placeholder="Misalnya S.E., M.Ak."
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
