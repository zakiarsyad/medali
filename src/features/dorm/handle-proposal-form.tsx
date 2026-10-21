"use client";

import { unstable_rethrow } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { handleDisciplineProposalAction } from "./proposal-actions";
import { parseHandlingNote } from "./proposal-input";
import styles from "./violations.module.css";
import { HANDLING_NOTE_MAX_LENGTH } from "./warning-ids";
import { handleQuestion } from "./warning-words";

/** Said when "Proses" did not reach the server, or no answer came back. */
export const HANDLING_NOT_SENT =
  "Pengajuan belum diproses karena tidak terkirim. Periksa koneksi internet, lalu coba lagi.";

const NOTHING: FormState = { error: null, done: null };

/**
 * "Catatan tindak lanjut" and "Proses" of one proposal still Diajukan,
 * for Kepala Unit. "Proses" asks before it saves, as it cannot be
 * undone. A note the server would refuse is answered at once and sent
 * nowhere. While it is on its way everything is switched off, so a
 * second press sends nothing more.
 */
export function HandleProposalForm({
  letterId,
  name,
}: {
  letterId: string;
  /** The name of the student, which the question and a screen reader say. */
  name: string;
}) {
  const [note, setNote] = useState("");
  const [answer, setAnswer] = useState(NOTHING);
  const [busy, startHandling] = useTransition();
  // Set at the press itself: `busy` is known only once the form is drawn
  // again, and a second press can come before that.
  const isOnItsWay = useRef(false);

  function handle() {
    const checked = parseHandlingNote(note);
    if (!checked.ok) return setAnswer({ error: checked.error, done: null });
    if (isOnItsWay.current) return;
    if (!window.confirm(handleQuestion(name))) return;
    isOnItsWay.current = true;
    startHandling(async () => {
      try {
        setAnswer(await handleDisciplineProposalAction({ letterId, note }));
      } catch (error) {
        unstable_rethrow(error);
        setAnswer({ error: HANDLING_NOT_SENT, done: null });
      } finally {
        isOnItsWay.current = false;
      }
    });
  }

  return (
    <div className={styles.decide}>
      <label className={`${shared.field} ${styles.decideNote}`}>
        Catatan tindak lanjut
        <input
          className={shared.input}
          placeholder="Apa yang akan dilakukan"
          maxLength={HANDLING_NOTE_MAX_LENGTH}
          aria-label={`Catatan tindak lanjut untuk ${name}`}
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
          onClick={handle}
        >
          Proses
        </button>
      </div>
      <FormMessage state={answer} />
    </div>
  );
}
