"use client";

import type { FormEvent } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { useSaveState } from "@/ui/use-save-state";
import { removeOldProofsAction } from "./actions";
import styles from "./proof-files.module.css";
import { type CountsByKind, totalOf } from "./proof-kinds";
import { removalQuestion } from "./removal-question";

const START: FormState = { error: null, done: null };

/**
 * "Hapus berkas lama", which asks first with how many files of each kind
 * will go. It is off while the days are not set or nothing may go.
 */
export function RemoveOldButton({
  removable,
  isSet,
}: {
  removable: CountsByKind;
  isSet: boolean;
}) {
  const [state, remove, pending] = useSaveState(removeOldProofsAction, START);
  const isOff = !isSet || totalOf(removable) === 0;

  function confirmFirst(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm(removalQuestion(removable))) event.preventDefault();
  }

  return (
    <form action={remove} onSubmit={confirmFirst} className={styles.removeRow}>
      <button
        type="submit"
        className={shared.button}
        disabled={isOff || pending}
      >
        Hapus berkas lama
      </button>
      <FormMessage state={state} />
    </form>
  );
}
