"use client";

import { useActionState, useState } from "react";
import { useAskBeforeLeaving } from "@/ui/ask-before-leaving";
import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import { sendForm } from "@/ui/send-form";
import { saveScoresAction } from "./actions";
import styles from "./mentoring.module.css";
import { ScoreBoxes } from "./score-boxes";
import type { ScoreFormState } from "./score-form-state";
import {
  afterSave,
  hasUnsavedScores,
  idsToSend,
  saveButtonWords,
  type Typed,
  withoutBoxes,
  withTyped,
} from "./score-form-values";
import type { ScoreRow } from "./score-rows";

const LEAVE_QUESTION =
  "Nilai pengasuhan belum disimpan. Tinggalkan tanpa menyimpan?";

const NOTHING_SENT: ScoreFormState = {
  error: null,
  done: null,
  changedIds: [],
};

/**
 * The form "Nilai anak asuh": a box for the score of each member, and a
 * button that saves the changed ones together. The button is off while
 * nothing is changed and while a save is on its way, so two presses send
 * once. A box whose score was saved in between, from another window, is
 * not saved: it goes back to the score kept now. Leaving with scores
 * that are not saved asks first.
 */
export function ScoreForm({
  groupId,
  rows,
}: {
  groupId: string;
  /** The Aktif members of the group, each with the score kept for them. */
  rows: readonly ScoreRow[];
}) {
  const [typed, setTyped] = useState<Typed>({});
  const sentIds = idsToSend(rows, typed);

  async function send(
    before: ScoreFormState,
    form: FormData,
  ): Promise<ScoreFormState> {
    const sent = typed;
    const after = await saveScoresAction(before, form);
    if (after.done) setTyped((now) => afterSave(now, sent, sentIds));
    if (after.changedIds.length > 0) {
      setTyped((now) => withoutBoxes(now, after.changedIds));
    }
    return after;
  }

  const [state, save, pending] = useActionState(send, NOTHING_SENT);
  useAskBeforeLeaving(hasUnsavedScores(rows, typed), LEAVE_QUESTION);

  return (
    // noValidate: the server says what is wrong, in the app's own words.
    <form onSubmit={(event) => sendForm(event, save)} noValidate>
      <input type="hidden" name="groupId" value={groupId} />
      <ScoreBoxes
        rows={rows}
        typed={typed}
        sentIds={sentIds}
        onType={(studentId, text) =>
          setTyped(withTyped(typed, studentId, text))
        }
      />
      <div className={`${styles.saveBar} ${styles.saveScores}`}>
        <button
          type="submit"
          className={shared.button}
          disabled={pending || sentIds.length === 0}
        >
          {saveButtonWords(sentIds.length)}
        </button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
