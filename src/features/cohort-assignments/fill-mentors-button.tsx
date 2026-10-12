"use client";

import { useActionState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { fillMentorsAction } from "./actions";
import { changeForm } from "./change-form";
import type { DraftKey } from "./draft-change-input";
import { useOneSave } from "./one-save";

const START: FormState = { error: null, done: null };

/** "Isi otomatis yang kosong", with what it answers under it. */
export function FillMentorsButton({ shown }: { shown: DraftKey }) {
  const [state, send] = useActionState(fillMentorsAction, START);
  const { isSaving, save } = useOneSave();
  return (
    <div>
      <button
        type="button"
        className={shared.quiet}
        disabled={isSaving}
        onClick={() => save(() => send(changeForm(shown)))}
      >
        Isi otomatis yang kosong
      </button>
      <FormMessage state={state} />
    </div>
  );
}
