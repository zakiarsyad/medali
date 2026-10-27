"use client";

import { useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import { NOT_SENT, sentOr } from "@/ui/save-not-sent";
import { restorePpksActivityAction } from "./actions";

/** "Urungkan" beside the message of a removal: brings the activity back. */
export function RestorePpksButton({
  id,
  onRestored,
}: {
  /** The activity that was just removed. */
  id: string;
  onRestored: (message: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startRestoring] = useTransition();

  function restore() {
    startRestoring(async () => {
      const after = await sentOr(() => restorePpksActivityAction(id), NOT_SENT);
      if (after.done) onRestored(after.done);
      setError(after.error);
    });
  }

  return (
    <>
      <button
        type="button"
        className={shared.link}
        onClick={restore}
        disabled={pending}
      >
        Urungkan
      </button>
      <FormMessage state={{ error, done: null }} />
    </>
  );
}
