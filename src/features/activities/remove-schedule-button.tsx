"use client";

import { useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import { removeScheduleAction } from "./actions";
import styles from "./activities.module.css";
import { REMOVAL_QUESTION } from "./form-words";

/** "Hapus jadwal" in the form of a schedule. It asks first. */
export function RemoveScheduleButton({
  id,
  onRemoved,
}: {
  id: string;
  onRemoved: (message: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startRemoving] = useTransition();

  function remove() {
    const sure = window.confirm(REMOVAL_QUESTION);
    if (!sure) return;
    startRemoving(async () => {
      const after = await removeScheduleAction(id);
      if (after.done) onRemoved(after.done);
      setError(after.error);
    });
  }

  return (
    <span className={styles.pushedEnd}>
      <FormMessage state={{ error, done: null }} />
      <button
        type="button"
        className={shared.danger}
        onClick={remove}
        disabled={pending}
      >
        Hapus jadwal
      </button>
    </span>
  );
}
