"use client";

import { useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import styles from "./cleaning.module.css";
import { judgeDutyAction } from "./cleaning-assessment-actions";
import { CLEANING_NOTE_MAX_LENGTH, type CleaningResult } from "./cleaning-ids";

/**
 * Catatan with "Memenuhi" and "Tidak memenuhi" for a duty BAM may judge.
 * What a judgement says goes up to the schedule, as the row changes with
 * it; a refusal stays here.
 */
export function CleaningJudgeForm({
  dutyId,
  onSaid,
}: {
  dutyId: string;
  onSaid: (text: string) => void;
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startSending] = useTransition();

  function send(result: CleaningResult) {
    startSending(async () => {
      const after = await judgeDutyAction(dutyId, result, note);
      setError(after.error);
      if (after.done) onSaid(after.done);
    });
  }

  return (
    <div className={styles.judge}>
      <input
        className={shared.input}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={CLEANING_NOTE_MAX_LENGTH}
        placeholder="Catatan (wajib bila tidak memenuhi)"
        aria-label="Catatan penilaian"
      />
      <button
        type="button"
        className={shared.button}
        onClick={() => send("met")}
        disabled={pending}
      >
        Memenuhi
      </button>
      <button
        type="button"
        className={shared.link}
        onClick={() => send("not_met")}
        disabled={pending}
      >
        Tidak memenuhi
      </button>
      <FormMessage state={{ error, done: null }} />
    </div>
  );
}
