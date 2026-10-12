"use client";

import { type FormEvent, useActionState } from "react";
import styles from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { removeBamRolesAction } from "./actions";

const START: FormState = { error: null, done: null };

interface RemoveBamButtonProps {
  accountId: string;
  name: string;
  roles: string;
}

export function RemoveBamButton({
  accountId,
  name,
  roles,
}: RemoveBamButtonProps) {
  const [state, action, pending] = useActionState(removeBamRolesAction, START);

  function confirmFirst(event: FormEvent<HTMLFormElement>) {
    const sure = window.confirm(
      `Hapus peran BAM ${name} (${roles})? Data mahasiswa dan peran Mahasiswa tetap tersimpan.`,
    );
    if (!sure) event.preventDefault();
  }

  return (
    <form action={action} onSubmit={confirmFirst} className={styles.inline}>
      <input type="hidden" name="accountId" value={accountId} />
      <button type="submit" className={styles.danger} disabled={pending}>
        Hapus
      </button>
      <FormMessage state={state} />
    </form>
  );
}
