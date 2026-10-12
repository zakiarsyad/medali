"use client";

import Link from "next/link";
import { useActionState } from "react";
import styles from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { changeBamRolesAction } from "./actions";
import { BamRoleChoices } from "./bam-role-choices";
import type { BamStudent } from "./list-bam-students";

const START: FormState = { error: null, done: null };

interface BamEditFormProps {
  student: BamStudent;
  /** The list address to go back to. */
  back: string;
}

export function BamEditForm({ student, back }: BamEditFormProps) {
  const [state, action, pending] = useActionState(changeBamRolesAction, START);
  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="accountId" value={student.accountId} />
      <input type="hidden" name="back" value={back} />
      <BamRoleChoices chosen={student.roles} />
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
