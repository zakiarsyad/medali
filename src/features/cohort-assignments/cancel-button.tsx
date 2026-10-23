"use client";

import { useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import { isToldAbove } from "./answer-place";
import { changeForm } from "./change-form";
import { cancelAction } from "./decree-actions";
import type { DraftKey } from "./draft-change-input";
import { cancelQuestion } from "./fix-words";
import { useOneSave } from "./one-save";

/**
 * "Batalkan penetapan" on a fixed angkatan, for an account that may fix.
 * It asks first, and says that the students go back to having no group.
 */
export function CancelButton({ shown }: { shown: DraftKey }) {
  const { isSaving, save, announce } = useOneSave();
  const [error, setError] = useState<string | null>(null);

  function cancel() {
    if (!window.confirm(cancelQuestion(shown.cohortYear))) return;
    save(async () => {
      const after = await cancelAction(changeForm(shown));
      if (isToldAbove("cancel", after)) {
        announce(after);
        return;
      }
      setError(after.error);
    });
  }

  return (
    <div>
      <button
        type="button"
        className={shared.quiet}
        disabled={isSaving}
        onClick={cancel}
      >
        Batalkan penetapan
      </button>
      <FormMessage state={{ error, done: null }} />
    </div>
  );
}
