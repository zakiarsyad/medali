"use client";

import { useEffect, useState, useTransition } from "react";
import {
  NEEDS_COUNSELLING_CONSENT,
  NO_SCREENING_OR_SESSION,
  PANEL_LEDE,
  PICK_FIRST,
} from "@/mental-health/sharing-words";
import type { Parsed } from "@/parsed";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import type { SharingOutcome } from "./change-sharing";
import type { ConsentPick } from "./consent-picks";
import styles from "./counselling.module.css";
import { askSharingAction, lookUpSharingAction } from "./sharing-actions";
import { SharingFacts } from "./sharing-facts";
import { type SharingAsk, SharingForm } from "./sharing-form";
import { SharingMoves, type SharingStepAction } from "./sharing-moves";
import { isCurrentSharing, offeredData } from "./sharing-rules";
import type { SharingPanel, SharingView } from "./sharing-view";

const NO_MESSAGE: FormState = { error: null, done: null };

function messageOf(outcome: SharingOutcome): FormState {
  if (outcome.kind === "kept") return { error: null, done: outcome.done };
  return { error: outcome.error, done: null };
}

/** What the panel offers for a student once read. */
export function StudentSharing({
  panel,
  name,
  pending,
  onAsk,
  onStep,
}: {
  panel: SharingPanel;
  /** The name of the student, for the questions asked first. */
  name: string;
  pending: boolean;
  onAsk: (ask: SharingAsk) => void;
  onStep: (action: SharingStepAction, sharing: SharingView) => void;
}) {
  const offered = offeredData(panel);
  if (offered.length === 0) {
    return <div className={styles.warnBox}>{NO_SCREENING_OR_SESSION}</div>;
  }
  const { sharing } = panel;
  const isCurrent = sharing !== null && isCurrentSharing(sharing.status);
  return (
    <>
      {sharing && <SharingFacts sharing={sharing} />}
      {sharing && isCurrent && (
        <SharingMoves
          sharing={sharing}
          name={name}
          pending={pending}
          onPress={(action) => onStep(action, sharing)}
        />
      )}
      {!isCurrent && !panel.hasConsent && (
        <p className={styles.sub}>{NEEDS_COUNSELLING_CONSENT}</p>
      )}
      {!isCurrent && panel.hasConsent && (
        <SharingForm offered={offered} pending={pending} onAsk={onAsk} />
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

  function step(action: SharingStepAction, sharing: SharingView) {
    startSending(async () => {
      shown(await action(student.id, sharing.id, sharing.version));
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
      <StudentSharing
        panel={looked.value}
        name={student.name}
        pending={pending}
        onAsk={ask}
        onStep={step}
      />
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
