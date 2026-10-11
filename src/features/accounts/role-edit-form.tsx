"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { StudyProgram } from "@/db/study-programs";
import styles from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { changeRolesAction } from "./actions";
import type { ManagedAccount } from "./manage-accounts";
import { ProgramChoice, RoleChoices } from "./role-choices";

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
