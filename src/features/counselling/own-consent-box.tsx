"use client";

import { useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { sentOr } from "@/ui/save-not-sent";
import type { ConsentOutcome } from "./change-consent";
import { ConsentStatusLine } from "./consent-badge";
import { studentMoves } from "./consent-rules";
import { type ConsentView, versionOfConsent } from "./consent-view";
import { CONSENT_TEXT } from "./consent-words";
import styles from "./counselling.module.css";
import { REFUSED_NOT_SENT } from "./not-sent";
import {
  approveConsentAction,
  declineConsentAction,
  withdrawConsentAction,
} from "./own-consent-actions";

const NO_MESSAGE: FormState = { error: null, done: null };

/** The question asked before a consent is withdrawn. */
export const WITHDRAW_QUESTION =
  "Cabut persetujuan konseling? Konselor perlu meminta persetujuan Anda lagi sebelum konseling dilanjutkan.";

function messageOf(outcome: ConsentOutcome): FormState {
  if (outcome.kind === "kept") return { error: null, done: outcome.done };
  return { error: outcome.error, done: null };
}

type Press = (version: string) => Promise<ConsentOutcome>;

function WaitingRequest({
  pending,
  onPress,
}: {
  pending: boolean;
  onPress: (action: Press) => void;
}) {
  return (
    <div className={styles.warnBox}>
      <b>Permintaan persetujuan konseling</b>
      <p>{CONSENT_TEXT}</p>
      <div className={shared.actions}>
        <button
          type="button"
          className={shared.button}
          disabled={pending}
          onClick={() => onPress(approveConsentAction)}
        >
          Setujui
        </button>
        <button
          type="button"
          className={shared.quiet}
          disabled={pending}
          onClick={() => onPress(declineConsentAction)}
        >
          Tolak
        </button>
      </div>
    </div>
  );
}

/**
 * "Persetujuan konseling" of the student: a waiting request with its
 * text, "Setujui" and "Tolak"; otherwise the status with its date, and
 * "Cabut persetujuan" while it is Disetujui. The page is drawn again
 * after a press, so `consent` is always the status as it is now.
 */
export function OwnConsentBox({ consent }: { consent: ConsentView | null }) {
  const [message, setMessage] = useState<FormState>(NO_MESSAGE);
  const [pending, startSending] = useTransition();
  const moves = studentMoves(consent?.status ?? null);

  function press(action: Press) {
    startSending(async () => {
      setMessage(
        messageOf(
          await sentOr(
            () => action(versionOfConsent(consent)),
            REFUSED_NOT_SENT,
          ),
        ),
      );
    });
  }

  return (
    <section className={`${shared.panel} ${styles.stack}`}>
      <h2 className={shared.heading}>Persetujuan konseling</h2>
      {moves.includes("approve") ? (
        <WaitingRequest pending={pending} onPress={press} />
      ) : (
        <ConsentStatusLine consent={consent} />
      )}
      {moves.includes("withdraw") && (
        <div>
          <button
            type="button"
            className={shared.danger}
            disabled={pending}
            onClick={() => {
              if (!window.confirm(WITHDRAW_QUESTION)) return;
              press(withdrawConsentAction);
            }}
          >
            Cabut persetujuan
          </button>
        </div>
      )}
      <FormMessage state={message} />
    </section>
  );
}
