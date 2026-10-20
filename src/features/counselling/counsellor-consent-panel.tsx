"use client";

import { useState, useTransition } from "react";
import type { Parsed } from "@/parsed";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import type { ConsentOutcome } from "./change-consent";
import {
  askConsentAction,
  lookUpConsentAction,
  recordPaperConsentAction,
} from "./consent-actions";
import { ConsentStatusLine } from "./consent-badge";
import type { ConsentPick } from "./consent-picks";
import { counsellorMoves } from "./consent-rules";
import { ConsentStudentPicker } from "./consent-student-picker";
import { type ConsentView, versionOfConsent } from "./consent-view";
import styles from "./counselling.module.css";
import { CounsellorSessionPart } from "./counsellor-session-part";
import { readSessionHistoryAction } from "./session-actions";
import type { SessionHistory } from "./session-view";

const NO_MESSAGE: FormState = { error: null, done: null };

/** The question asked before a paper form is recorded. */
export function paperQuestion(name: string): string {
  return `Catat form persetujuan konseling tertulis yang sudah ditandatangani ${name}? Status menjadi Disetujui.`;
}

function messageOf(outcome: ConsentOutcome): FormState {
  if (outcome.kind === "kept") return { error: null, done: outcome.done };
  return { error: outcome.error, done: null };
}

function Buttons({
  consent,
  pending,
  onAsk,
  onRecord,
}: {
  consent: ConsentView | null;
  pending: boolean;
  onAsk: () => void;
  onRecord: () => void;
}) {
  const moves = counsellorMoves(consent?.status ?? null);
  if (moves.length === 0) return null;
  return (
    <div className={shared.actions}>
      {moves.includes("ask") && (
        <button
          type="button"
          className={shared.button}
          disabled={pending}
          onClick={onAsk}
        >
          Kirim permintaan persetujuan
        </button>
      )}
      {moves.includes("record_paper") && (
        <button
          type="button"
          className={shared.quiet}
          disabled={pending}
          onClick={onRecord}
        >
          Catat form tertulis yang sudah ditandatangani
        </button>
      )}
    </div>
  );
}

/**
 * "Persetujuan konseling" of Konselor: a student is picked, their
 * consent shown, and a request sent or a signed paper form recorded. A
 * press refused because the consent changed shows the current status.
 * An account that may keep sessions also writes them down and reads
 * them here.
 */
export function CounsellorConsentPanel({
  mayKeepSessions,
}: {
  mayKeepSessions: boolean;
}) {
  const [picked, setPicked] = useState<ConsentPick | null>(null);
  const [looked, setLooked] = useState<Parsed<ConsentView | null> | null>(null);
  const [sessions, setSessions] = useState<Parsed<SessionHistory> | null>(null);
  const [message, setMessage] = useState<FormState>(NO_MESSAGE);
  const [pending, startSending] = useTransition();

  function pick(student: ConsentPick) {
    setPicked(student);
    setLooked(null);
    setSessions(null);
    setMessage(NO_MESSAGE);
    startSending(async () => {
      const [consent, history] = await Promise.all([
        lookUpConsentAction(student.id),
        mayKeepSessions ? readSessionHistoryAction(student.id, 1) : null,
      ]);
      setLooked(consent);
      setSessions(history);
    });
  }

  function clear() {
    setPicked(null);
    setLooked(null);
    setSessions(null);
    setMessage(NO_MESSAGE);
  }

  function send(
    student: ConsentPick,
    consent: ConsentView | null,
    action: typeof askConsentAction,
  ) {
    startSending(async () => {
      const outcome = await action(student.id, versionOfConsent(consent));
      setMessage(messageOf(outcome));
      if (outcome.kind !== "refused") {
        setLooked({ ok: true, value: outcome.consent });
      }
    });
  }

  return (
    <section className={`${shared.panel} ${styles.stack}`}>
      <h2 className={shared.heading}>Persetujuan konseling</h2>
      <ConsentStudentPicker picked={picked} onPick={pick} onClear={clear} />
      {picked === null && (
        <p className={styles.sub}>
          Pilih mahasiswa untuk melihat status persetujuan.
        </p>
      )}
      {picked !== null && looked !== null && !looked.ok && (
        <FormMessage state={{ error: looked.error, done: null }} />
      )}
      {picked !== null && looked?.ok && (
        <>
          <ConsentStatusLine consent={looked.value} />
          <Buttons
            consent={looked.value}
            pending={pending}
            onAsk={() => send(picked, looked.value, askConsentAction)}
            onRecord={() => {
              if (!window.confirm(paperQuestion(picked.name))) return;
              send(picked, looked.value, recordPaperConsentAction);
            }}
          />
          {looked.value?.status === "waiting" && (
            <p className={styles.sub}>
              Menunggu jawaban mahasiswa di halaman Konseling miliknya.
            </p>
          )}
          <FormMessage state={message} />
          {sessions !== null && (
            <CounsellorSessionPart
              key={picked.id}
              studentId={picked.id}
              consent={looked.value}
              history={sessions}
            />
          )}
        </>
      )}
    </section>
  );
}
