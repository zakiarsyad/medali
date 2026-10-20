"use client";

import { type FormEvent, useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import styles from "./mentor-groups.module.css";
import {
  cancelSurveyPeriodAction,
  changeSurveyEndAction,
  closeSurveyPeriodAction,
} from "./survey-actions";
import { useSurveySaid } from "./survey-said";
import { CLOSE_QUESTION, cancelQuestion } from "./survey-words";

const START: FormState = { error: null, done: null };

type EndingAction = (form: FormData) => Promise<FormState>;

/**
 * What Kepala Unit may do with the running survey period, under its
 * card: change its last day, close it now, or cancel it. Closing and
 * cancelling ask first. Every button is off while a change is on its
 * way, so two presses send one.
 */
export function SurveyControls({
  periodId,
  startsOn,
  endsOn,
  answers,
}: {
  periodId: string;
  /** The first day of the period, which its last day cannot come before. */
  startsOn: string;
  endsOn: string;
  /** The answers that came in, which a cancel leaves unused. */
  answers: number;
}) {
  const { isSending, send, announce } = useSurveySaid();
  const [said, setSaid] = useState(START);

  function saveEnd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    send(async () => setSaid(await changeSurveyEndAction(form)));
  }

  function end(action: EndingAction, question: string) {
    if (!window.confirm(question)) return;
    const form = new FormData();
    form.set("surveyPeriodId", periodId);
    send(async () => {
      const after = await action(form);
      if (after.done !== null) {
        // The form that opens a period takes the place of the card.
        announce(after.done);
        return;
      }
      setSaid(after);
    });
  }

  return (
    <>
      {/* noValidate: the server says what is wrong, in the words of the app. */}
      <form onSubmit={saveEnd} className={shared.form} noValidate>
        <input type="hidden" name="surveyPeriodId" value={periodId} />
        <label className={shared.field}>
          Ubah tanggal ditutup
          <input
            // Made anew when the date is saved, so the field shows what is stored.
            key={endsOn}
            name="endsOn"
            type="date"
            className={shared.input}
            min={startsOn}
            defaultValue={endsOn}
          />
        </label>
        <div className={styles.fieldEnd}>
          <button type="submit" className={shared.quiet} disabled={isSending}>
            Simpan tanggal
          </button>
        </div>
        <div className={shared.actions}>
          <button
            type="button"
            className={shared.button}
            disabled={isSending}
            onClick={() => end(closeSurveyPeriodAction, CLOSE_QUESTION)}
          >
            Tutup periode sekarang
          </button>
          <button
            type="button"
            className={shared.quiet}
            disabled={isSending}
            onClick={() =>
              end(cancelSurveyPeriodAction, cancelQuestion(answers))
            }
          >
            Batalkan periode
          </button>
        </div>
        <FormMessage state={said} />
      </form>
      <p className={styles.quiet}>
        Hanya satu periode evaluasi yang dapat dibuka pada satu waktu.
      </p>
    </>
  );
}
