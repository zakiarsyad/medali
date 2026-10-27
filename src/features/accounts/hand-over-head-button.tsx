"use client";

import type { FormEvent } from "react";
import styles from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { useSaveState } from "@/ui/use-save-state";
import { handOverHeadOfUnitAction } from "./actions";

const START: FormState = { error: null, done: null };

export function handOverQuestion(name: string): string {
  return `Serahkan jabatan Kepala Unit kepada ${name}? Anda tidak lagi menjadi Kepala Unit.`;
}

interface HandOverHeadButtonProps {
  accountId: string;
  name: string;
}

export function HandOverHeadButton({
  accountId,
  name,
}: HandOverHeadButtonProps) {
  const [state, action, pending] = useSaveState(
    handOverHeadOfUnitAction,
    START,
  );

  function confirmFirst(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm(handOverQuestion(name))) event.preventDefault();
  }

  return (
    <form action={action} onSubmit={confirmFirst} className={styles.inline}>
      <input type="hidden" name="accountId" value={accountId} />
      <button type="submit" className={styles.link} disabled={pending}>
        Jadikan Kepala Unit
      </button>
      <FormMessage state={state} />
    </form>
  );
}
