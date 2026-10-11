"use client";

import { type FormEvent, useActionState } from "react";
import { type FormState, removeAccountAction } from "./actions";
import { FormMessage } from "./form-message";
import styles from "./users-screen.module.css";

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
