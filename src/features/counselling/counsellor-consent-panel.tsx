"use client";

import type { Ref } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import { askConsentAction, recordPaperConsentAction } from "./consent-actions";
import { ConsentStatusLine } from "./consent-badge";
import { counsellorMoves } from "./consent-rules";
import { ConsentStudentPicker } from "./consent-student-picker";
import type { ConsentView } from "./consent-view";
import styles from "./counselling.module.css";
import { CounsellorSessionPart } from "./counsellor-session-part";
import type { ConsentPicking } from "./use-consent-pick";

/** The question asked before a paper form is recorded. */
export function paperQuestion(name: string): string {
  return `Catat form persetujuan konseling tertulis yang sudah ditandatangani ${name}? Status menjadi Disetujui.`;
}

function Buttons({
  consent,
  pending,
  onAsk,
  onRecord,
}: {
  consent: ConsentView | null;
  pending: boolean;
  onAsk: () => void;
  onRecord: () => void;
}) {
  const moves = counsellorMoves(consent?.status ?? null);
  if (moves.length === 0) return null;
  return (
    <div className={shared.actions}>
      {moves.includes("ask") && (
        <button
          type="button"
          className={shared.button}
          disabled={pending}
          onClick={onAsk}
        >
          Kirim permintaan persetujuan
        </button>
      )}
      {moves.includes("record_paper") && (
        <button
          type="button"
          className={shared.quiet}
          disabled={pending}
          onClick={onRecord}
        >
          Catat form tertulis yang sudah ditandatangani
        </button>
      )}
    </div>
  );
}

/**
 * "Persetujuan konseling" of Konselor: a student is picked, their
 * consent shown, and a request sent or a signed paper form recorded. A
 * press refused because the consent changed shows the current status.
 * An account that may keep sessions also writes them down and reads
 * them here. `picking` holds the student picked, here or by "Tindak
 * lanjuti" of a referral.
 */
export function CounsellorConsentPanel({
  picking,
  ref,
}: {
  picking: ConsentPicking;
  /** The panel, which "Tindak lanjuti" brings into view. */
  ref?: Ref<HTMLElement>;
}) {
  const { picked, looked, sessions, message, pending, pick, clear, send } =
    picking;
  return (
    <section className={`${shared.panel} ${styles.stack}`} ref={ref}>
      <h2 className={shared.heading}>Persetujuan konseling</h2>
      <ConsentStudentPicker picked={picked} onPick={pick} onClear={clear} />
      {picked === null && (
        <p className={styles.sub}>
          Pilih mahasiswa untuk melihat status persetujuan.
        </p>
      )}
      {picked !== null && looked !== null && !looked.ok && (
        <FormMessage state={{ error: looked.error, done: null }} />
      )}
      {picked !== null && looked?.ok && (
        <>
          <ConsentStatusLine consent={looked.value} />
          <Buttons
            consent={looked.value}
            pending={pending}
            onAsk={() => send(picked, looked.value, askConsentAction)}
            onRecord={() => {
              if (!window.confirm(paperQuestion(picked.name))) return;
              send(picked, looked.value, recordPaperConsentAction);
            }}
          />
          {looked.value?.status === "waiting" && (
            <p className={styles.sub}>
              Menunggu jawaban mahasiswa di halaman Konseling miliknya.
            </p>
          )}
          <FormMessage state={message} />
          {sessions !== null && (
            <CounsellorSessionPart
              key={picked.id}
              studentId={picked.id}
              consent={looked.value}
              history={sessions}
              onKept={picking.noteSessionKept}
            />
          )}
        </>
      )}
    </section>
  );
}
