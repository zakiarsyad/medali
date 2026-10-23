"use client";

import { useState, useTransition } from "react";
import type { SessionHistory } from "@/mental-health/session-view";
import type { Parsed } from "@/parsed";
import type { FormState } from "@/ui/form-message";
import type { ConsentOutcome } from "./change-consent";
import { type askConsentAction, lookUpConsentAction } from "./consent-actions";
import type { ConsentPick } from "./consent-picks";
import { type ConsentView, versionOfConsent } from "./consent-view";
import { readSessionHistoryAction } from "./session-actions";

const NO_MESSAGE: FormState = { error: null, done: null };

function messageOf(outcome: ConsentOutcome): FormState {
  if (outcome.kind === "kept") return { error: null, done: outcome.done };
  return { error: outcome.error, done: null };
}

/**
 * The student picked on "Persetujuan konseling", their consent and
 * sessions as the server gave them, and the message of the last press.
 * Held above the panel, so "Tindak lanjuti" of a referral picks a
 * student in it too. An account that may keep sessions also reads them.
 */
export function useConsentPick(mayKeepSessions: boolean) {
  const [picked, setPicked] = useState<ConsentPick | null>(null);
  const [looked, setLooked] = useState<Parsed<ConsentView | null> | null>(null);
  const [sessions, setSessions] = useState<Parsed<SessionHistory> | null>(null);
  const [message, setMessage] = useState<FormState>(NO_MESSAGE);
  const [pending, startSending] = useTransition();
  // How many sessions were kept or changed here, so the panels that
  // depend on the sessions read them again.
  const [sessionsKept, setSessionsKept] = useState(0);

  function noteSessionKept() {
    setSessionsKept((kept) => kept + 1);
  }

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

  return {
    picked,
    looked,
    sessions,
    message,
    pending,
    sessionsKept,
    pick,
    clear,
    send,
    noteSessionKept,
  };
}

export type ConsentPicking = ReturnType<typeof useConsentPick>;
