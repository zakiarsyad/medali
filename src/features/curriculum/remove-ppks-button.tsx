"use client";

import { useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import { removePpksActivityAction } from "./actions";
import styles from "./curriculum.module.css";

/** "Hapus" in the form of an activity. It asks nothing first. */
export function RemovePpksButton({
  id,
  onRemoved,
}: {
  id: string;
  onRemoved: (message: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startRemoving] = useTransition();

  function remove() {
    startRemoving(async () => {
      const after = await removePpksActivityAction(id);
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
        Hapus
      </button>
    </span>
  );
}
