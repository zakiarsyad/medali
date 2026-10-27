"use client";

import { useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import { NOT_SENT, sentOr } from "@/ui/save-not-sent";
import { removePpksActivityAction, scheduleCountAction } from "./actions";
import styles from "./curriculum.module.css";
import { removalQuestion } from "./ppks-activities";

/**
 * "Hapus" in the form of an activity. It asks first, with how often the
 * activity is scheduled at the moment of the press. Nothing is removed
 * when that number cannot be read.
 */
export function RemovePpksButton({
  id,
  name,
  onRemoved,
}: {
  id: string;
  /** The saved name of the activity, shown in the question. */
  name: string;
  onRemoved: (message: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startRemoving] = useTransition();

  function remove() {
    setError(null);
    startRemoving(async () => {
      const counted = await scheduleCountAction(id);
      if (!counted.ok) {
        setError(counted.error);
        return;
      }
      const sure = window.confirm(removalQuestion(name, counted.value));
      if (!sure) return;
      const after = await sentOr(() => removePpksActivityAction(id), NOT_SENT);
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
