"use client";

import { useEffect, useState, useTransition } from "react";
import type { Parsed } from "@/parsed";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import type { SharingOutcome } from "./change-sharing";
import type { ConsentPick } from "./consent-picks";
import styles from "./counselling.module.css";
import { askSharingAction, lookUpSharingAction } from "./sharing-actions";
import { SharingFacts } from "./sharing-facts";
import { type SharingAsk, SharingForm } from "./sharing-form";
import { isCurrentSharing } from "./sharing-rules";
import type { SharingPanel } from "./sharing-view";
import {
  NEEDS_COUNSELLING_CONSENT,
  NO_SESSION,
  PANEL_LEDE,
  PICK_FIRST,
} from "./sharing-words";

const NO_MESSAGE: FormState = { error: null, done: null };

function messageOf(outcome: SharingOutcome): FormState {
  if (outcome.kind === "kept") return { error: null, done: outcome.done };
  return { error: outcome.error, done: null };
}

/** What the panel offers for a student once read. */
export function StudentSharing({
  panel,
  pending,
  onAsk,
}: {
  panel: SharingPanel;
  pending: boolean;
  onAsk: (ask: SharingAsk) => void;
}) {
  if (!panel.hasSessions) {
    return <div className={styles.warnBox}>{NO_SESSION}</div>;
  }
  const { sharing } = panel;
  const isCurrent = sharing !== null && isCurrentSharing(sharing.status);
  return (
    <>
      {sharing && <SharingFacts sharing={sharing} />}
      {sharing?.status === "waiting" && (
        <p className={styles.sub}>
          Menunggu persetujuan mahasiswa di halaman Konseling miliknya.
        </p>
      )}
      {!isCurrent && !panel.hasConsent && (
        <p className={styles.sub}>{NEEDS_COUNSELLING_CONSENT}</p>
      )}
      {!isCurrent && panel.hasConsent && (
        <SharingForm pending={pending} onAsk={onAsk} />
      )}
    </>
  );
}

/**
 * The sharing of one picked student: read when the student is picked,
 * and kept as the server gave it back after each press. A press refused
 * because the sharing changed shows the current one.
 */
function PickedSharing({ student }: { student: ConsentPick }) {
  const [looked, setLooked] = useState<Parsed<SharingPanel> | null>(null);
  const [message, setMessage] = useState<FormState>(NO_MESSAGE);
  const [pending, startSending] = useTransition();

  useEffect(() => {
    startSending(async () => {
      setLooked(await lookUpSharingAction(student.id));
    });
  }, [student.id]);

  function shown(outcome: SharingOutcome) {
    setMessage(messageOf(outcome));
    if (outcome.kind === "refused" || !looked?.ok) return;
    setLooked({
      ok: true,
      value: { ...looked.value, sharing: outcome.sharing },
    });
  }

  function ask(sent: SharingAsk) {
    startSending(async () => {
      shown(
        await askSharingAction(
          student.id,
          sent.data,
          sent.recipients,
          sent.summary,
        ),
      );
    });
  }

  if (looked === null) return null;
  if (!looked.ok) {
    return <FormMessage state={{ error: looked.error, done: null }} />;
  }
  return (
    <>
      <p className={styles.picked}>
        <b>{student.name}</b>
        <span className={styles.sub}>{student.nim}</span>
      </p>
      <StudentSharing panel={looked.value} pending={pending} onAsk={ask} />
      <FormMessage state={message} />
    </>
  );
}

/**
 * "Publikasi data kesehatan mental" of Konselor, about the student picked
 * on "Persetujuan konseling". `consentVersion` is that student's consent
 * as the consent panel shows it, null until it is read: a change of it
 * reads the sharing again, as asking needs the consent.
 */
export function CounsellorSharingPanel({
  picked,
  consentVersion,
}: {
  picked: ConsentPick | null;
  consentVersion: string | null;
}) {
  return (
    <section className={`${shared.panel} ${styles.stack}`}>
      <div>
        <h2 className={shared.heading}>Publikasi data kesehatan mental</h2>
        <p className={styles.sub}>{PANEL_LEDE}</p>
      </div>
      {picked === null && <p className={styles.sub}>{PICK_FIRST}</p>}
      {picked !== null && consentVersion !== null && (
        <PickedSharing
          key={`${picked.id}|${consentVersion}`}
          student={picked}
        />
      )}
    </section>
  );
}
