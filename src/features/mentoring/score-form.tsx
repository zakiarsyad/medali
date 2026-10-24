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
import { INDICATORS_VERSION_OF_SCORES } from "./score-input";
import type { ScoreRow } from "./score-rows";

const LEAVE_QUESTION =
  "Nilai pengasuhan belum disimpan. Tinggalkan tanpa menyimpan?";

const NOTHING_SENT: ScoreFormState = {
  error: null,
  done: null,
  changedIds: [],
};

/**
 * The form "Nilai anak asuh": six choices for each member, and a button
 * that saves the changed rows together. The button is off while nothing
 * is changed and while a save is on its way, so two presses send once. A
 * row whose score was saved in between, from another window, is not
 * saved: it goes back to the score kept now. Leaving with scores that
 * are not saved asks first.
 */
export function ScoreForm({
  groupId,
  rows,
  names,
  indicatorsVersion,
}: {
  groupId: string;
  /** The Aktif members of the group, each with the score kept for them. */
  rows: readonly ScoreRow[];
  /** The names of the indicators in force, in their order. */
  names: readonly string[];
  /** The version of those indicators, so a save after they change is refused. */
  indicatorsVersion: string;
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
      <input
        type="hidden"
        name={INDICATORS_VERSION_OF_SCORES}
        value={indicatorsVersion}
      />
      <ScoreBoxes
        rows={rows}
        names={names}
        typed={typed}
        sentIds={sentIds}
        onChoose={(row, place, text) =>
          setTyped(withTyped(typed, row, place, text))
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
