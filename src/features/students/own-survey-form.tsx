"use client";

import { useEffect, useId, useState, useTransition } from "react";
import {
  SUGGESTION_MAX,
  SURVEY_SCALE,
  SURVEY_STATEMENTS,
} from "@/mentoring/survey-statements";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { refusedResult, sentOr } from "@/ui/save-not-sent";
import { deviceStorage } from "@/ui/survey-drafts";
import type { OwnSurvey } from "./own-survey";
import styles from "./own-survey.module.css";
import {
  answeredCount,
  firstUnanswered,
  unansweredWords,
} from "./own-survey-rules";
import { answeredWords, SCALE_KEY } from "./own-survey-words";
import { sendOwnSurveyAction } from "./survey-actions";
import {
  dropDraft,
  emptyScores,
  keepDraft,
  readDraft,
  type SurveyDraft,
} from "./survey-draft";

const START: FormState = { error: null, done: null };

/** The five buttons of one statement, as radio buttons. */
function ScoreButtons({
  statement,
  chosen,
  disabled,
  onChoose,
}: {
  /** Counted from 1. */
  statement: number;
  chosen: number;
  disabled: boolean;
  onChoose: (score: number) => void;
}) {
  const name = `${useId()}-score`;
  return (
    <fieldset className={styles.scores} disabled={disabled}>
      <legend className={shared.hidden}>Pernyataan {statement}</legend>
      {SURVEY_SCALE.map((meaning, index) => {
        const score = index + 1;
        return (
          <label key={meaning} className={styles.score} title={meaning}>
            <input
              type="radio"
              name={name}
              value={score}
              className={shared.hidden}
              checked={chosen === score}
              onChange={() => onChoose(score)}
            />
            {score}
          </label>
        );
      })}
    </fieldset>
  );
}

/**
 * The eight statements, each with its buttons 1 to 5, and "Saran untuk
 * pengasuh (opsional)". Before the first send, what is filled in is kept
 * on the device, so a refresh does not lose it; nothing reaches the
 * server before "Kirim survei". `start` is what the form opens with: the
 * answer sent before, or nothing.
 */
export function OwnSurveyForm({
  survey,
  draftKey,
  start,
  onSent,
  onCancel,
}: {
  survey: OwnSurvey;
  /** Where the device keeps what is filled in, for this student and period. */
  draftKey: string;
  start: SurveyDraft | null;
  onSent: () => void;
  /** "Batal", only while an answer sent before is changed. */
  onCancel: (() => void) | null;
}) {
  const keepsDraft = start === null;
  const [scores, setScores] = useState(start?.scores ?? emptyScores());
  const [suggestion, setSuggestion] = useState(start?.suggestion ?? "");
  const [said, setSaid] = useState(START);
  const [isSending, startSending] = useTransition();

  // Read after the first drawing: the server has no storage of the device.
  useEffect(() => {
    if (!keepsDraft) return;
    const draft = readDraft(deviceStorage(), draftKey);
    if (draft === null) return;
    setScores(draft.scores);
    setSuggestion(draft.suggestion);
  }, [keepsDraft, draftKey]);

  function change(draft: SurveyDraft) {
    setScores(draft.scores);
    setSuggestion(draft.suggestion);
    if (keepsDraft) keepDraft(deviceStorage(), draftKey, draft);
  }

  function choose(index: number, score: number) {
    const next = scores.map((before, at) => (at === index ? score : before));
    change({ scores: next, suggestion });
  }

  function send() {
    const unanswered = firstUnanswered(scores);
    if (unanswered !== null) {
      setSaid({ error: unansweredWords(unanswered), done: null });
      return;
    }
    setSaid(START);
    startSending(async () => {
      const sent = await sentOr(
        () =>
          sendOwnSurveyAction({
            surveyPeriodId: survey.surveyPeriodId,
            mentorId: survey.mentorId,
            scores,
            suggestion,
          }),
        refusedResult,
      );
      if (!sent.ok) {
        setSaid({ error: sent.error, done: null });
        return;
      }
      dropDraft(deviceStorage(), draftKey);
      onSent();
    });
  }

  return (
    <>
      <ol className={styles.statements}>
        {SURVEY_STATEMENTS.map((statement, index) => (
          <li key={statement} className={styles.statement}>
            <span>
              <b>{index + 1}.</b> {statement}
            </span>
            <ScoreButtons
              statement={index + 1}
              chosen={scores[index] ?? 0}
              disabled={isSending}
              onChoose={(score) => choose(index, score)}
            />
          </li>
        ))}
      </ol>
      <p className={styles.key}>{SCALE_KEY}</p>
      <div className={styles.bottom}>
        <label className={shared.field}>
          Saran untuk pengasuh (opsional)
          <textarea
            className={shared.input}
            rows={3}
            maxLength={SUGGESTION_MAX}
            placeholder="Masukan agar pendampingan lebih baik"
            value={suggestion}
            disabled={isSending}
            onChange={(event) =>
              change({ scores, suggestion: event.target.value })
            }
          />
        </label>
        <div className={shared.actions}>
          <button
            type="button"
            className={shared.button}
            disabled={isSending}
            onClick={send}
          >
            Kirim survei
          </button>
          {onCancel !== null && (
            <button
              type="button"
              className={shared.quiet}
              disabled={isSending}
              onClick={onCancel}
            >
              Batal
            </button>
          )}
          <span className={styles.sub}>
            {answeredWords(answeredCount(scores))}
          </span>
        </div>
        <FormMessage state={said} />
      </div>
    </>
  );
}
