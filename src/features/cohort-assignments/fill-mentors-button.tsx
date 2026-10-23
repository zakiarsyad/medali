"use client";

import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import { fillMentorsAction } from "./actions";
import { changeForm } from "./change-form";
import type { DraftKey } from "./draft-change-input";
import { useChangeAnswer, useOneSave } from "./one-save";

/** "Isi otomatis yang kosong", with what it answers under it. */
export function FillMentorsButton({ shown }: { shown: DraftKey }) {
  const [state, sendChange] = useChangeAnswer(fillMentorsAction);
  const { isSaving, save } = useOneSave();
  return (
    <div>
      <button
        type="button"
        className={shared.quiet}
        disabled={isSaving}
        onClick={() => save(() => sendChange(changeForm(shown)))}
      >
        Isi otomatis yang kosong
      </button>
      <FormMessage state={state} />
    </div>
  );
}
