"use client";

import { type ReactNode, useEffect, useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { deviceStorage, forgetSurveyDrafts } from "@/ui/survey-drafts";
import type { OwnSurvey, SentSurvey } from "./own-survey";
import styles from "./own-survey.module.css";
import { OwnSurveyForm } from "./own-survey-form";
import {
  PRIVACY_WORDS,
  SENT_THANKS,
  SURVEY_TITLE,
  sentWords,
  surveyPeriodWords,
} from "./own-survey-words";

const START: FormState = { error: null, done: null };

/** The title of the card, the line under it and its badge. */
function CardHead({ line, badge }: { line: ReactNode; badge: ReactNode }) {
  return (
    <div className={styles.head}>
      <div>
        <h2 className={shared.heading}>{SURVEY_TITLE}</h2>
        <p className={styles.sub}>{line}</p>
      </div>
      {badge}
    </div>
  );
}

/** The sent answer, while it is not being changed. */
function SentAnswer({
  survey,
  sent,
  onChange,
}: {
  survey: OwnSurvey;
  sent: SentSurvey;
  onChange: () => void;
}) {
  return (
    <>
      <CardHead
        line={surveyPeriodWords(survey)}
        badge={
          <span className={`${shared.badge} ${styles.sent}`}>Terkirim</span>
        }
      />
      <p className={styles.sub}>{sentWords(sent)}</p>
      <div className={shared.actions}>
        <button type="button" className={shared.quiet} onClick={onChange}>
          Ubah jawaban
        </button>
      </div>
    </>
  );
}

/** What "Ubah jawaban" brings back into the form. */
function startOf(sent: SentSurvey) {
  return { scores: sent.scores, suggestion: sent.suggestion ?? "" };
}

/**
 * "Survei kepuasan pengasuhan" at the top of Profil saya, while a survey
 * period is Dibuka for a student with a pengasuh. Before the first send
 * it holds the form. Once an answer is sent it shows "Terkirim" with the
 * time, and "Ubah jawaban" brings the answer back into the form, with
 * "Batal" to leave it as it was.
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
  const [changing, setChanging] = useState(false);
  const { sent } = survey;
  const draftKept = sent === null ? draftKey : null;

  // A device may be shared: only the draft still being filled in stays,
  // and none once an answer is sent.
  useEffect(() => {
    forgetSurveyDrafts(deviceStorage(), draftKept);
  }, [draftKept]);

  function sentNow() {
    setChanging(false);
    setSaid({ error: null, done: SENT_THANKS });
  }

  if (sent !== null && !changing) {
    return (
      <section className={shared.panel}>
        <SentAnswer
          survey={survey}
          sent={sent}
          onChange={() => {
            setSaid(START);
            setChanging(true);
          }}
        />
        <FormMessage state={said} />
      </section>
    );
  }
  return (
    <section className={shared.panel}>
      <CardHead
        line={
          <>
            {surveyPeriodWords(survey)} · pengasuh Anda:{" "}
            <b>{survey.mentorName}</b>
          </>
        }
        badge={
          <span className={shared.badge}>
            {sent === null ? "Belum diisi" : "Ubah jawaban"}
          </span>
        }
      />
      <p className={styles.sub}>{PRIVACY_WORDS}</p>
      <OwnSurveyForm
        survey={survey}
        draftKey={draftKey}
        start={sent === null ? null : startOf(sent)}
        onSent={sentNow}
        onCancel={sent === null ? null : () => setChanging(false)}
      />
    </section>
  );
}
