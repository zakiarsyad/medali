"use client";

import { type FormEvent, useActionState } from "react";
import styles from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { removeAccountAction } from "./actions";

const START: FormState = { error: null, done: null };

interface RemoveAccountButtonProps {
  accountId: string;
  name: string;
  roles: string;
}

export function RemoveAccountButton({
  accountId,
  name,
  roles,
}: RemoveAccountButtonProps) {
  const [state, action, pending] = useActionState(removeAccountAction, START);

  function confirmFirst(event: FormEvent<HTMLFormElement>) {
    const sure = window.confirm(
      `Hapus akun ${name} (${roles})? Akun tidak bisa lagi masuk. Data yang pernah dicatat tetap tersimpan.`,
    );
    if (!sure) event.preventDefault();
  }

  return (
    <form action={action} onSubmit={confirmFirst} className={styles.inline}>
      <input type="hidden" name="accountId" value={accountId} />
      <input type="hidden" name="name" value={name} />
      <button type="submit" className={styles.danger} disabled={pending}>
        Hapus
      </button>
      <FormMessage state={state} />
    </form>
  );
}
