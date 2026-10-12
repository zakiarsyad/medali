"use client";

import { useActionState, useState } from "react";
import styles from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { sendForm } from "@/ui/send-form";
import { giveBamRolesAction } from "./actions";
import panel from "./bam-panel.module.css";
import { BamRoleChoices } from "./bam-role-choices";
import { StudentSearch } from "./student-search";

const START: FormState = { error: null, done: null };

export function AddBamForm() {
  const [saves, setSaves] = useState(0);

  async function give(before: FormState, form: FormData): Promise<FormState> {
    const after = await giveBamRolesAction(before, form);
    // A new search and no ticks after each save: the student just added
    // is no longer offered. After an error both stay, to be corrected.
    if (after.done) setSaves((count) => count + 1);
    return after;
  }

  const [state, save, pending] = useActionState(give, START);
  return (
    <details className={panel.add}>
      <summary className={styles.button}>Tambah pengurus BAM</summary>
      <form onSubmit={(event) => sendForm(event, save)} className={styles.form}>
        <StudentSearch key={`search-${saves}`} />
        <BamRoleChoices key={`roles-${saves}`} chosen={[]} />
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
