"use client";

import { use, useState, useTransition } from "react";
import {
  COACHING_NOTE_MAX_LENGTH,
  COACHING_STATUS_WORDS,
  COACHING_STATUSES,
  type CoachingStatus,
  isCoachingStatus,
} from "@/character-scores/coaching-status";
import shared from "@/ui/data-screen.module.css";
import { changeCoachingStatusAction } from "./coaching-actions";
import styles from "./coaching-list.module.css";
import { SetCoachingMessage } from "./coaching-message";

/** The note of what was done, under the status, when there is one. */
function NoteLine({ note }: { note: string }) {
  if (note === "") return null;
  return <small className={styles.note}>{note}</small>;
}

/** The status of a row, as a label for an account that may not change it. */
export function CoachingStatusLabel({
  status,
  note,
}: {
  status: CoachingStatus;
  note: string;
}) {
  return (
    <>
      <span className={shared.badge}>{COACHING_STATUS_WORDS[status]}</span>
      <NoteLine note={note} />
    </>
  );
}

/**
 * The status choice of a row. Choosing another status opens the short
 * "Catatan" of what was done and "Simpan status"; what the server
 * answers shows above the list, and the row follows once the page is
 * read again: the new status, or the current one when someone changed
 * it first.
 */
export function CoachingStatusCell({
  studentId,
  name,
  status,
  note,
  version,
}: {
  studentId: string;
  /** The student's name, for the choice's label. */
  name: string;
  status: CoachingStatus;
  note: string;
  /** The version of the status shown, 0 for none saved, sent with a change. */
  version: number;
}) {
  const setMessage = use(SetCoachingMessage);
  const [chosen, setChosen] = useState<CoachingStatus | null>(null);
  const [typed, setTyped] = useState("");
  const [pending, startSending] = useTransition();

  function choose(value: string) {
    if (!isCoachingStatus(value)) return;
    setChosen(value === status ? null : value);
    setTyped("");
  }

  function send(sending: CoachingStatus) {
    setMessage({ error: null, done: null });
    startSending(async () => {
      const answer = await changeCoachingStatusAction(
        studentId,
        version,
        sending,
        typed,
      );
      setMessage(answer);
      // Kept or refused, the row shows the status the page reads again.
      setChosen(null);
    });
  }

  return (
    <>
      <select
        className={`${shared.input} ${styles.control}`}
        aria-label={`Status pembinaan ${name}`}
        value={chosen ?? status}
        disabled={pending}
        onChange={(event) => choose(event.target.value)}
      >
        {COACHING_STATUSES.map((choice) => (
          <option key={choice} value={choice}>
            {COACHING_STATUS_WORDS[choice]}
          </option>
        ))}
      </select>
      {chosen === null ? (
        <NoteLine note={note} />
      ) : (
        <div className={styles.change}>
          <label className={styles.field}>
            <span className={shared.label}>Catatan (opsional)</span>
            <textarea
              className={shared.input}
              rows={2}
              maxLength={COACHING_NOTE_MAX_LENGTH}
              placeholder="Langkah yang sudah dilakukan"
              value={typed}
              disabled={pending}
              onChange={(event) => setTyped(event.target.value)}
            />
          </label>
          <div className={shared.actions}>
            <button
              type="button"
              className={shared.button}
              disabled={pending}
              onClick={() => send(chosen)}
            >
              Simpan status
            </button>
            <button
              type="button"
              className={shared.quiet}
              disabled={pending}
              onClick={() => setChosen(null)}
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </>
  );
}
