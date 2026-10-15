"use client";

import { unstable_rethrow } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import styles from "./violations.module.css";
import { issueWarningLetterAction } from "./warning-actions";
import {
  PROPOSAL_NOTE_MAX_LENGTH,
  RESULT_MAX_LENGTH,
  type WarningLevel,
} from "./warning-ids";
import { parseIssue } from "./warning-input";
import { issueButtonWords, issueQuestion } from "./warning-words";

/** Said when the SP did not reach the server, or no answer came back. */
export const ISSUE_NOT_SENT =
  "SP belum terbit karena tidak terkirim. Periksa koneksi internet, lalu coba lagi.";

const NOTHING: FormState = { error: null, done: null };

/**
 * "2. Catat klarifikasi dan terbitkan SP": Hasil klarifikasi, the note of
 * the proposal for SP 2, and the button, which asks before it issues as
 * an SP cannot be undone. Text the server would refuse is answered at
 * once and sent nowhere. While it is on its way everything is switched
 * off, so a second press sends nothing more.
 */
export function IssueLetterForm({
  studentId,
  name,
  level,
}: {
  studentId: string;
  /** The name of the resident, which the question before issuing says. */
  name: string;
  level: WarningLevel;
}) {
  const [result, setResult] = useState("");
  const [proposalNote, setProposalNote] = useState("");
  const [answer, setAnswer] = useState(NOTHING);
  const [busy, startIssuing] = useTransition();
  // Set at the press itself: `busy` is known only once the form is drawn
  // again, and a second press can come before that.
  const isOnItsWay = useRef(false);

  function issue() {
    const checked = parseIssue({ result, proposalNote }, level);
    if (!checked.ok) return setAnswer({ error: checked.error, done: null });
    if (isOnItsWay.current) return;
    if (!window.confirm(issueQuestion(name, level))) return;
    isOnItsWay.current = true;
    startIssuing(async () => {
      try {
        setAnswer(
          await issueWarningLetterAction({
            studentId,
            level,
            result,
            proposalNote,
          }),
        );
      } catch (error) {
        unstable_rethrow(error);
        setAnswer({ error: ISSUE_NOT_SENT, done: null });
      } finally {
        isOnItsWay.current = false;
      }
    });
  }

  return (
    <div className={shared.form}>
      <label className={`${shared.field} ${styles.field} ${styles.full}`}>
        Hasil klarifikasi
        <textarea
          className={shared.input}
          placeholder="Ringkasan keterangan mahasiswa dan kesepakatan"
          maxLength={RESULT_MAX_LENGTH}
          value={result}
          disabled={busy}
          onChange={(event) => setResult(event.target.value)}
        />
      </label>
      {level === 2 && (
        <label className={`${shared.field} ${styles.field} ${styles.full}`}>
          Catatan pengajuan hukuman disiplin ke Kepala UPK
          <textarea
            className={shared.input}
            placeholder="Pertimbangan Pengelola Asrama"
            maxLength={PROPOSAL_NOTE_MAX_LENGTH}
            value={proposalNote}
            disabled={busy}
            onChange={(event) => setProposalNote(event.target.value)}
          />
        </label>
      )}
      <div className={shared.actions}>
        <button
          type="button"
          className={shared.button}
          disabled={busy}
          onClick={issue}
        >
          {issueButtonWords(level)}
        </button>
      </div>
      <FormMessage state={answer} />
    </div>
  );
}
