"use client";

import { useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { NOT_SENT, sentOr } from "@/ui/save-not-sent";
import styles from "./mentor-groups.module.css";
import { fixSurveyResultsAction } from "./survey-actions";

const START: FormState = { error: null, done: null };

/** What Kepala Unit is offered for a period whose results may be fixed. */
export interface FixOffer {
  surveyPeriodId: string;
  /** What the box says the fixing does. */
  words: string;
  /** What is asked before the results are fixed. */
  question: string;
}

/**
 * The box above the table of a period that is over: who fixed its
 * results and when, or for Kepala Unit "Tetapkan hasil evaluasi" while
 * they are not fixed. The button asks first and is off while the request
 * is on its way, so two presses send one. What the fixing said stays
 * above the box that takes the button's place.
 */
export function SurveyFixPart({
  fixedWords,
  offer,
}: {
  /** Who fixed the results and when, or null while they are not fixed. */
  fixedWords: string | null;
  /** Null for an account that may not fix them, or once they are fixed. */
  offer: FixOffer | null;
}) {
  const [said, setSaid] = useState(START);
  const [isSending, startSending] = useTransition();

  function fix(chosen: FixOffer) {
    if (!window.confirm(chosen.question)) return;
    const form = new FormData();
    form.set("surveyPeriodId", chosen.surveyPeriodId);
    startSending(async () =>
      setSaid(await sentOr(() => fixSurveyResultsAction(form), NOT_SENT)),
    );
  }

  return (
    <>
      <FormMessage state={said} />
      {fixedWords !== null && <p className={styles.facts}>{fixedWords}</p>}
      {fixedWords === null && offer !== null && (
        <div className={styles.facts}>
          <p>{offer.words}</p>
          <div className={shared.actions}>
            <button
              type="button"
              className={shared.button}
              disabled={isSending}
              onClick={() => fix(offer)}
            >
              Tetapkan hasil evaluasi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
