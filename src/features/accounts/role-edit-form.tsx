"use client";

import Link from "next/link";
import { useActionState } from "react";
import { changeRolesAction, type FormState } from "./actions";
import { FormMessage } from "./form-message";
import type { ManagedAccount } from "./manage-accounts";
import { ProgramChoice, RoleChoices } from "./role-choices";
import type { StudyProgram } from "./study-programs";
import styles from "./users-screen.module.css";

const START: FormState = { error: null, done: null };

interface RoleEditFormProps {
  account: ManagedAccount;
  programs: StudyProgram[];
  /** The list address to go back to. */
  back: string;
}

export function RoleEditForm({ account, programs, back }: RoleEditFormProps) {
  const [state, action, pending] = useActionState(changeRolesAction, START);
  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="accountId" value={account.id} />
      <input type="hidden" name="back" value={back} />
      <RoleChoices chosen={account.roles} />
      <ProgramChoice programs={programs} chosen={account.studyProgramId} />
      <label className={styles.field}>
        Unit atau jabatan
        <input
          name="unit"
          className={styles.input}
          defaultValue={account.unit ?? ""}
        />
      </label>
      <FormMessage state={state} />
      <div className={styles.actions}>
        <button type="submit" className={styles.button} disabled={pending}>
          Simpan peran
        </button>
        <Link href={back} className={styles.quiet}>
          Batal
        </Link>
      </div>
    </form>
  );
}
