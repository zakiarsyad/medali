"use client";

import { useState, useTransition } from "react";
import { ROLES } from "@/auth/roles";
import shared from "@/ui/data-screen.module.css";
import { shownDay, shownMoment } from "@/ui/day";
import { FormMessage, type FormState } from "@/ui/form-message";
import type { OwnRequest } from "./own-requests";
import { withdrawSikuRequestAction } from "./request-actions";
import { RequestPhotoThumbs } from "./request-photo-thumbs";
import { RequestStatusBadge } from "./request-status-badge";
import styles from "./siku.module.css";
import { REASON_WORDS } from "./siku-words";

export const NO_REQUESTS = "Belum ada pengajuan.";

export const WITHDRAW_QUESTION = "Tarik pengajuan ini?";

export const GAIN_CANCELLED_NOTE =
  "Penambahan poin dari pengajuan ini dibatalkan oleh penilai.";

const START: FormState = { error: null, done: null };

/** When it was sent, and the role that checked it and when, never a name. */
function sentAndChecked(request: OwnRequest): string {
  const sent = `Diajukan ${shownMoment(request.sentAt)}`;
  const { decidedAs, decidedAt } = request;
  if (decidedAs === null || decidedAt === null) return sent;
  return `${sent} · diperiksa ${ROLES[decidedAs].title}, ${shownMoment(decidedAt)}`;
}

function WithdrawButton({
  id,
  onAnswer,
}: {
  id: string;
  onAnswer: (answer: FormState) => void;
}) {
  const [pending, startSending] = useTransition();

  function press() {
    if (!window.confirm(WITHDRAW_QUESTION)) return;
    startSending(async () => onAnswer(await withdrawSikuRequestAction(id)));
  }

  return (
    <button
      type="button"
      className={shared.quiet}
      onClick={press}
      disabled={pending}
    >
      Tarik pengajuan
    </button>
  );
}

function RequestItem({
  request,
  onAnswer,
}: {
  request: OwnRequest;
  onAnswer: (answer: FormState) => void;
}) {
  return (
    <li className={styles.request}>
      <span className={shared.detail}>{shownDay(request.day)}</span>
      <div>
        <RequestStatusBadge status={request.status} points={request.points} />{" "}
        <b>{REASON_WORDS[request.reason]}</b>
      </div>
      <p className={shared.typed}>{request.report}</p>
      <RequestPhotoThumbs photos={request.photos} />
      <p className={shared.detail}>{sentAndChecked(request)}</p>
      {request.note !== "" && (
        <p className={shared.detail}>Catatan penilai: {request.note}</p>
      )}
      {request.status === "cancelled" && (
        <p className={shared.detail}>{GAIN_CANCELLED_NOTE}</p>
      )}
      {request.status === "waiting" && (
        <WithdrawButton id={request.id} onAnswer={onAnswer} />
      )}
    </li>
  );
}

/**
 * "Pengajuan saya": each request of the student, the newest first, with
 * where it stands, the role that checked it and "Tarik pengajuan" while
 * it waits. The answer to "Tarik pengajuan" stays above the list, since
 * the request leaves it once it is withdrawn.
 */
export function OwnRequestList({
  requests,
}: {
  requests: readonly OwnRequest[];
}) {
  const [answer, setAnswer] = useState(START);
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Pengajuan saya</h2>
      <p className={styles.sub}>Status pemeriksaan oleh Penilai Mahasiswa</p>
      <FormMessage state={answer} />
      {requests.length === 0 ? (
        <p className={shared.empty}>{NO_REQUESTS}</p>
      ) : (
        <ul className={styles.requests}>
          {requests.map((request) => (
            <RequestItem
              key={request.id}
              request={request}
              onAnswer={setAnswer}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
