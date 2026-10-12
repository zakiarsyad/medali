"use client";

import { useActionState, useState } from "react";
import styles from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { giveBamRolesAction } from "./actions";
import panel from "./bam-panel.module.css";
import { BamRoleChoices } from "./bam-role-choices";
import { StudentSearch } from "./student-search";

const START: FormState = { error: null, done: null };

export function AddBamForm() {
  const [saves, setSaves] = useState(0);

  async function save(before: FormState, form: FormData): Promise<FormState> {
    const after = await giveBamRolesAction(before, form);
    // A new search after each save: the student just added is no longer offered.
    if (after.done) setSaves((count) => count + 1);
    return after;
  }

  const [state, action, pending] = useActionState(save, START);
  return (
    <details className={panel.add}>
      <summary className={styles.button}>Tambah pengurus BAM</summary>
      <form action={action} className={styles.form}>
        <StudentSearch key={saves} />
        <BamRoleChoices chosen={[]} />
        <FormMessage state={state} />
        <div className={styles.actions}>
          <button type="submit" className={styles.button} disabled={pending}>
            Simpan peran
          </button>
        </div>
      </form>
    </details>
  );
}
