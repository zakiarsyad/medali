"use client";

import { unstable_rethrow } from "next/navigation";
import { type FormEvent, useRef, useTransition } from "react";
import type { SendEdges } from "@/clarifications/clarification-draft";
import shared from "@/ui/data-screen.module.css";
import type { FormState } from "@/ui/form-message";
import { shrinkPhoto } from "@/ui/shrink-photo";
import { sendViolationAppealAction } from "./appeal-actions";
import { appealDraftOf, sendAppealDraft } from "./appeal-draft";
import styles from "./violations.module.css";

/** The form's ties to this browser and to the server. */
const EDGES: SendEdges = {
  shrink: shrinkPhoto,
  send: sendViolationAppealAction,
  rethrow: unstable_rethrow,
};

/**
 * The kinds the file chooser offers, so a phone offers its camera beside
 * its files; the server checks what is sent.
 */
const TAKEN_KINDS = "image/*,application/pdf";

/**
 * The form a resident appeals one of their violations with: Alasan
 * advokasi, Bukti pendukung, "Kirim advokasi", "Batal" and the deadline,
 * one column on a phone. It is sent by the screen code, not by the
 * browser, which would empty the fields on any answer. While it is sent
 * neither button can be pressed, so a second press sends nothing more.
 */
export function AppealForm({
  violationId,
  deadline,
  onAnswer,
  onCancel,
}: {
  violationId: string;
  /** The end of the appeal time, as the tab shows an hour. */
  deadline: string;
  onAnswer: (answer: FormState) => void;
  onCancel: () => void;
}) {
  const [sending, startSending] = useTransition();
  // Set at the press itself: `sending` is known only once the form is
  // drawn again, and a second press can come before that.
  const isOnItsWay = useRef(false);

  function submitted(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isOnItsWay.current) return;
    isOnItsWay.current = true;
    const draft = appealDraftOf(violationId, new FormData(event.currentTarget));
    startSending(async () => {
      try {
        onAnswer(await sendAppealDraft(draft, EDGES));
      } finally {
        isOnItsWay.current = false;
      }
    });
  }

  return (
    <form className={shared.form} onSubmit={submitted} noValidate>
      <label className={`${shared.field} ${styles.field} ${styles.full}`}>
        Alasan advokasi
        <textarea
          name="reason"
          rows={3}
          className={shared.input}
          placeholder="Jelaskan mengapa pelanggaran ini tidak tepat, misalnya Anda sedang izin resmi atau bertugas di kegiatan lain."
        />
      </label>
      <label className={`${shared.field} ${styles.field} ${styles.full}`}>
        Bukti pendukung (opsional, PDF atau gambar maks. 4 MB)
        <input
          type="file"
          name="file"
          accept={TAKEN_KINDS}
          className={shared.input}
        />
      </label>
      <div className={`${shared.actions} ${styles.full}`}>
        <button type="submit" className={shared.button} disabled={sending}>
          {sending ? "Mengirim…" : "Kirim advokasi"}
        </button>
        <button
          type="button"
          className={shared.quiet}
          disabled={sending}
          onClick={onCancel}
        >
          Batal
        </button>
        <span className={styles.note}>Batas pengajuan {deadline}</span>
      </div>
    </form>
  );
}
