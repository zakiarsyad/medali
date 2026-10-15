"use client";

import { unstable_rethrow } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import type { FormState } from "@/ui/form-message";
import { decideViolationAppealAction } from "./appeal-actions";
import {
  type AppealDecisionKind,
  parseAppealDecision,
} from "./appeal-decision";
import { APPEAL_NOTE_MAX_LENGTH } from "./appeal-ids";
import styles from "./violations.module.css";

/** Said when a decision did not reach the server, or no answer came back. */
export const DECISION_NOT_SENT =
  "Putusan tidak terkirim. Periksa koneksi internet, lalu coba lagi.";

/**
 * "Catatan BAM", "Terima" and "Tolak" of one waiting appeal. A decision
 * the server would refuse for its note is answered at once and sent
 * nowhere. While a decision is on its way everything is switched off,
 * so a second press sends nothing more. What a press answers goes to
 * `onAnswer`.
 */
export function AppealDecide({
  appealId,
  name,
  onAnswer,
}: {
  appealId: string;
  /** The name of the student, which tells the cards apart for a screen reader. */
  name: string;
  onAnswer: (answer: FormState) => void;
}) {
  const [note, setNote] = useState("");
  const [busy, startDeciding] = useTransition();
  // Set at the press itself: `busy` is known only once the card is drawn
  // again, and a second press can come before that.
  const isOnItsWay = useRef(false);

  function decide(kind: AppealDecisionKind) {
    const checked = parseAppealDecision(kind, note);
    if (!checked.ok) return onAnswer({ error: checked.error, done: null });
    if (isOnItsWay.current) return;
    isOnItsWay.current = true;
    startDeciding(async () => {
      try {
        onAnswer(await decideViolationAppealAction(appealId, kind, note));
      } catch (error) {
        unstable_rethrow(error);
        onAnswer({ error: DECISION_NOT_SENT, done: null });
      } finally {
        isOnItsWay.current = false;
      }
    });
  }

  return (
    <div className={styles.decide}>
      <label className={`${shared.field} ${styles.decideNote}`}>
        Catatan BAM
        <input
          className={shared.input}
          placeholder="Wajib bila ditolak"
          maxLength={APPEAL_NOTE_MAX_LENGTH}
          aria-label={`Catatan BAM untuk ${name}`}
          value={note}
          disabled={busy}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      <div className={shared.actions}>
        <button
          type="button"
          className={shared.button}
          disabled={busy}
          onClick={() => decide("accept")}
        >
          Terima
        </button>
        <button
          type="button"
          className={shared.quiet}
          disabled={busy}
          onClick={() => decide("reject")}
        >
          Tolak
        </button>
      </div>
    </div>
  );
}
