"use client";

import { useEffect, useState, useTransition } from "react";
import type { SessionHistory } from "@/mental-health/session-view";
import { NEEDS_CONSENT } from "@/mental-health/session-words";
import type { Parsed } from "@/parsed";
import { FormMessage, type FormState } from "@/ui/form-message";
import type { ChangeOutcome } from "./change-session";
import type { ConsentView } from "./consent-view";
import styles from "./counselling.module.css";
import { readSessionHistoryAction } from "./session-actions";
import { SessionForm } from "./session-form";
import { SessionHistoryList } from "./session-history-list";

const NO_MESSAGE: FormState = { error: null, done: null };

function messageOf(outcome: ChangeOutcome): FormState {
  if (outcome.kind === "kept") return { error: null, done: outcome.done };
  return { error: outcome.error, done: null };
}

/**
 * Whether "Riwayat sesi" is read once more: a consent recorded after the
 * student was picked, when the first reading was refused.
 */
export function rereadsHistory(mayWrite: boolean, readable: boolean): boolean {
  return mayWrite && !readable;
}

/**
 * The sessions of the student picked in "Persetujuan konseling": "Catat
 * sesi" while the consent is Disetujui, or why no session can be written
 * while it is not, and "Riwayat sesi", with "Ubah" only while it is
 * Disetujui. A student who never gave consent has no "Riwayat sesi". `history` is "Riwayat sesi" as read when the student was
 * picked; it is read again when a consent is recorded, and after a session
 * is kept or changed, so a change someone made first shows.
 */
export function CounsellorSessionPart({
  studentId,
  consent,
  history: first,
}: {
  studentId: string;
  consent: ConsentView | null;
  history: Parsed<SessionHistory>;
}) {
  const [history, setHistory] = useState(first);
  const [steps, setSteps] = useState(1);
  const [message, setMessage] = useState<FormState>(NO_MESSAGE);
  const [pending, startReading] = useTransition();
  const mayWrite = consent?.status === "approved";

  useEffect(() => {
    if (!rereadsHistory(mayWrite, history.ok)) return;
    startReading(async () => {
      setHistory(await readSessionHistoryAction(studentId, 1));
    });
  }, [mayWrite, history.ok, studentId]);

  function reload(wanted: number, said: FormState = NO_MESSAGE) {
    startReading(async () => {
      setHistory(await readSessionHistoryAction(studentId, wanted));
      setSteps(wanted);
      setMessage(said);
    });
  }

  return (
    <>
      {mayWrite ? (
        <SessionForm studentId={studentId} onSaved={() => reload(1)} />
      ) : (
        <p className={styles.sub}>{NEEDS_CONSENT}</p>
      )}
      <FormMessage state={message} />
      {history.ok && (
        <SessionHistoryList
          history={history.value}
          mayChange={mayWrite}
          pending={pending}
          onMore={() => reload(steps + 1)}
          onChanged={(outcome) => reload(steps, messageOf(outcome))}
        />
      )}
      {/* Refused for want of consent, which is said above already. */}
      {!history.ok && history.error !== NEEDS_CONSENT && (
        <FormMessage state={{ error: history.error, done: null }} />
      )}
    </>
  );
}
