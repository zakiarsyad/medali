"use client";

import { useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import type { OwnSurvey } from "./own-survey";
import styles from "./own-survey.module.css";
import { OwnSurveyForm } from "./own-survey-form";
import {
  PRIVACY_WORDS,
  SENT_THANKS,
  SURVEY_TITLE,
  surveyPeriodWords,
} from "./own-survey-words";

const START: FormState = { error: null, done: null };

/**
 * "Survei kepuasan pengasuhan" at the top of Profil saya, while a survey
 * period is Dibuka for a student with a pengasuh: the period, the mentor
 * the answer is for, and the form.
 */
export function OwnSurveyCard({
  survey,
  draftKey,
}: {
  survey: OwnSurvey;
  /** Where the device keeps a half-filled form, for this student and period. */
  draftKey: string;
}) {
  const [said, setSaid] = useState(START);
  return (
    <section className={shared.panel}>
      <div className={styles.head}>
        <div>
          <h2 className={shared.heading}>{SURVEY_TITLE}</h2>
          <p className={styles.sub}>
            {surveyPeriodWords(survey)} · pengasuh Anda:{" "}
            <b>{survey.mentorName}</b>
          </p>
        </div>
        <span className={shared.badge}>Belum diisi</span>
      </div>
      <p className={styles.sub}>{PRIVACY_WORDS}</p>
      <OwnSurveyForm
        survey={survey}
        draftKey={draftKey}
        start={null}
        onSent={() => setSaid({ error: null, done: SENT_THANKS })}
        onCancel={null}
      />
      <FormMessage state={said} />
    </section>
  );
}
