"use client";

import shared from "@/ui/data-screen.module.css";
import { DAY } from "@/ui/day";
import type { SharingOutcome } from "./change-sharing";
import styles from "./counselling.module.css";
import {
  cancelSharingAction,
  publishSharingAction,
  recordPaperSharingAction,
} from "./sharing-actions";
import type { SharingView } from "./sharing-view";

/** A press of Konselor on the sharing shown. */
export type SharingStepAction = (
  studentId: string,
  sharingId: string,
  version: string,
) => Promise<SharingOutcome>;

/** The questions asked before a step that needs a confirmation. */
export function paperSharingQuestion(name: string): string {
  return `Catat persetujuan berbagi data tertulis yang sudah ditandatangani ${name}? Status menjadi Disetujui.`;
}

export function cancelRequestQuestion(name: string): string {
  return `Batalkan permintaan berbagi data ${name}?`;
}

export function cancelApprovedQuestion(name: string): string {
  return `Batalkan berbagi data ${name}? Data tidak akan dipublikasikan.`;
}

export function pullQuestion(name: string): string {
  return `Tarik publikasi data kesehatan mental ${name}? Data langsung tidak tampil lagi bagi penerima.`;
}

function confirmed(question: string): boolean {
  return window.confirm(question);
}

function dayOf(moment: Date | null): string {
  return moment === null ? "" : DAY.format(moment);
}

/**
 * The buttons of Konselor on a current sharing, as in the prototype: a
 * waiting request can be recorded from paper or cancelled, an approved
 * one published or cancelled, a published one taken back. Recording,
 * cancelling and taking back ask first.
 */
export function SharingMoves({
  sharing,
  name,
  pending,
  onPress,
}: {
  sharing: SharingView;
  /** The name of the student, for the questions. */
  name: string;
  pending: boolean;
  onPress: (action: SharingStepAction) => void;
}) {
  function pressAfter(question: string, action: SharingStepAction) {
    if (!confirmed(question)) return;
    onPress(action);
  }

  if (sharing.status === "waiting") {
    return (
      <>
        <p className={styles.sub}>
          Menunggu persetujuan mahasiswa di halaman Konseling miliknya.
        </p>
        <div className={shared.actions}>
          <button
            type="button"
            className={shared.quiet}
            disabled={pending}
            onClick={() =>
              pressAfter(paperSharingQuestion(name), recordPaperSharingAction)
            }
          >
            Catat persetujuan tertulis
          </button>
          <button
            type="button"
            className={shared.quiet}
            disabled={pending}
            onClick={() =>
              pressAfter(cancelRequestQuestion(name), cancelSharingAction)
            }
          >
            Batalkan permintaan
          </button>
        </div>
      </>
    );
  }
  if (sharing.status === "approved") {
    return (
      <>
        <p className={styles.sub}>
          Mahasiswa sudah menyetujui pada {dayOf(sharing.answeredAt)}. Data
          belum tampil bagi penerima sampai Anda mempublikasikannya.
        </p>
        <div className={shared.actions}>
          <button
            type="button"
            className={shared.button}
            disabled={pending}
            onClick={() => onPress(publishSharingAction)}
          >
            Publikasikan
          </button>
          <button
            type="button"
            className={shared.quiet}
            disabled={pending}
            onClick={() =>
              pressAfter(cancelApprovedQuestion(name), cancelSharingAction)
            }
          >
            Batalkan
          </button>
        </div>
      </>
    );
  }
  if (sharing.status === "published") {
    return (
      <>
        <p className={styles.sub}>
          Tampil bagi penerima sejak {dayOf(sharing.publishedAt)}.
        </p>
        <div className={shared.actions}>
          <button
            type="button"
            className={shared.danger}
            disabled={pending}
            onClick={() => pressAfter(pullQuestion(name), cancelSharingAction)}
          >
            Tarik publikasi
          </button>
        </div>
      </>
    );
  }
  return null;
}
