"use client";

import { useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import type { SharingOutcome } from "./change-sharing";
import styles from "./counselling.module.css";
import {
  approveSharingAction,
  declineSharingAction,
  withdrawSharingAction,
} from "./own-sharing-actions";
import { studentSharingMoves } from "./sharing-rules";
import type { SharingView } from "./sharing-view";
import { dataLine, recipientsLine, SHARED_DATA_WORDS } from "./sharing-words";

const NO_MESSAGE: FormState = { error: null, done: null };

/** The question asked before the student withdraws a sharing. */
export const WITHDRAW_SHARING_QUESTION =
  "Cabut persetujuan berbagi data? Data langsung tidak tampil lagi bagi penerima.";

function messageOf(outcome: SharingOutcome): FormState {
  if (outcome.kind === "kept") return { error: null, done: outcome.done };
  return { error: outcome.error, done: null };
}

type Press = (sharingId: string, version: string) => Promise<SharingOutcome>;

function WaitingRequest({
  sharing,
  pending,
  onPress,
}: {
  sharing: SharingView;
  pending: boolean;
  onPress: (action: Press) => void;
}) {
  return (
    <div className={styles.warnBox}>
      <b>Permintaan persetujuan berbagi data</b>
      <p>
        Konselor meminta izin membagikan data kesehatan mental Anda kepada{" "}
        <b>{recipientsLine(sharing.recipients)}</b> untuk keperluan
        pendampingan. Data yang dibagikan:
      </p>
      <ul>
        {sharing.data.map((data) => (
          <li key={data}>{SHARED_DATA_WORDS[data]}</li>
        ))}
      </ul>
      {sharing.summary && (
        <p>Ringkasan yang akan dibagikan: “{sharing.summary}”</p>
      )}
      <p className={styles.sub}>
        Catatan sesi konseling tidak pernah dibagikan. Persetujuan dapat Anda
        cabut kapan saja.
      </p>
      <div className={shared.actions}>
        <button
          type="button"
          className={shared.button}
          disabled={pending}
          onClick={() => onPress(approveSharingAction)}
        >
          Setujui berbagi data
        </button>
        <button
          type="button"
          className={shared.quiet}
          disabled={pending}
          onClick={() => onPress(declineSharingAction)}
        >
          Tolak
        </button>
      </div>
    </div>
  );
}

function GivenSharing({
  sharing,
  pending,
  onPress,
}: {
  sharing: SharingView;
  pending: boolean;
  onPress: (action: Press) => void;
}) {
  const title =
    sharing.status === "published"
      ? "Data dibagikan"
      : "Persetujuan berbagi data diberikan";
  return (
    <div className={`${styles.card} ${styles.stack}`}>
      <p>
        <b>{title}</b> kepada {recipientsLine(sharing.recipients)}:{" "}
        {dataLine(sharing.data)}.
      </p>
      {sharing.summary && <p>Ringkasan: “{sharing.summary}”</p>}
      <div>
        <button
          type="button"
          className={shared.danger}
          disabled={pending}
          onClick={() => {
            if (!window.confirm(WITHDRAW_SHARING_QUESTION)) return;
            onPress(withdrawSharingAction);
          }}
        >
          Cabut persetujuan berbagi
        </button>
      </div>
    </div>
  );
}

/**
 * The student's current sharing on their own Konseling: a waiting request
 * with who it is for, what it gives and the exact summary, "Setujui
 * berbagi data" and "Tolak"; once approved or published, what is shared
 * with whom and "Cabut persetujuan berbagi". The page is drawn again
 * after a press, so `sharing` is always the sharing as it is now; the
 * message of the press stays when the box is gone.
 */
export function OwnSharingBox({ sharing }: { sharing: SharingView | null }) {
  const [message, setMessage] = useState<FormState>(NO_MESSAGE);
  const [pending, startSending] = useTransition();
  const moves = studentSharingMoves(sharing?.status ?? null);

  function press(action: Press) {
    if (sharing === null) return;
    startSending(async () => {
      setMessage(messageOf(await action(sharing.id, sharing.version)));
    });
  }

  return (
    <>
      {sharing && moves.includes("approve") && (
        <WaitingRequest sharing={sharing} pending={pending} onPress={press} />
      )}
      {sharing && moves.includes("withdraw") && (
        <GivenSharing sharing={sharing} pending={pending} onPress={press} />
      )}
      <FormMessage state={message} />
    </>
  );
}
