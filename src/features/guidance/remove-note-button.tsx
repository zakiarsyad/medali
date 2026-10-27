"use client";

import { useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { refusedSave, sentOr } from "@/ui/save-not-sent";
import { removeViolationNoteAction } from "./note-actions";
import { REMOVE_QUESTION } from "./note-messages";

const START: FormState = { error: null, done: null };

/**
 * "Hapus" on a note, asked once more before it is sent. A removed note
 * leaves the list as the page is drawn again; a note someone else
 * removed first says so here.
 */
export function RemoveNoteButton({ id }: { id: string }) {
  const [answer, setAnswer] = useState<FormState>(START);
  const [pending, startSending] = useTransition();

  function press() {
    if (!window.confirm(REMOVE_QUESTION)) return;
    startSending(async () =>
      setAnswer(await sentOr(() => removeViolationNoteAction(id), refusedSave)),
    );
  }

  return (
    <>
      <button
        type="button"
        className={shared.danger}
        onClick={press}
        disabled={pending}
      >
        Hapus
      </button>
      <FormMessage state={answer} />
    </>
  );
}
