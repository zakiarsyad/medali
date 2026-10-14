"use client";

import { unstable_rethrow } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import type { FormState } from "@/ui/form-message";
import { START_POINTS } from "./entry-draft";
import { decideSikuRequestAction } from "./request-actions";
import { type DecisionKind, parseDecision } from "./request-decision";
import { DECISION_NOTE_MAX_LENGTH } from "./request-ids";
import styles from "./siku.module.css";
import { POINTS_MAX, POINTS_MIN } from "./siku-ids";

/** Said when a decision did not reach the server, or no answer came back. */
export const DECISION_NOT_SENT =
  "Putusan tidak terkirim. Periksa koneksi internet, lalu coba lagi.";

/**
 * Poin, "Catatan penilai", "Setujui" and "Tolak" of one waiting request.
 * A decision the server would refuse for its points or its note is
 * answered at once and sent nowhere. While a decision is on its way
 * everything is switched off, so a second press sends nothing more.
 * What a press answers goes to `onAnswer`.
 */
export function RequestDecide({
  requestId,
  name,
  onAnswer,
}: {
  requestId: string;
  /** The name of the student, which tells the cards apart for a screen reader. */
  name: string;
  onAnswer: (answer: FormState) => void;
}) {
  const [points, setPoints] = useState(START_POINTS.gain);
  const [note, setNote] = useState("");
  const [busy, startDeciding] = useTransition();
  // Set at the press itself: `busy` is known only once the card is drawn
  // again, and a second press can come before that.
  const isOnItsWay = useRef(false);

  function decide(kind: DecisionKind) {
    const checked = parseDecision(kind, points, note);
    if (!checked.ok) return onAnswer({ error: checked.error, done: null });
    if (isOnItsWay.current) return;
    isOnItsWay.current = true;
    startDeciding(async () => {
      try {
        onAnswer(await decideSikuRequestAction(requestId, kind, points, note));
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
      <label className={shared.field}>
        Poin
        <input
          type="number"
          className={`${shared.input} ${styles.points}`}
          min={POINTS_MIN}
          max={POINTS_MAX}
          step={1}
          inputMode="numeric"
          aria-label={`Poin untuk ${name}`}
          value={points}
          disabled={busy}
          onChange={(event) => setPoints(event.target.value)}
        />
      </label>
      <label className={`${shared.field} ${styles.decideNote}`}>
        Catatan penilai
        <input
          className={shared.input}
          placeholder="Wajib bila ditolak"
          maxLength={DECISION_NOTE_MAX_LENGTH}
          aria-label={`Catatan penilai untuk ${name}`}
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
          onClick={() => decide("approve")}
        >
          Setujui
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
