"use client";

import { useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { text } from "@/ui/form-data";
import { FormMessage, type FormState } from "@/ui/form-message";
import { CounsellorScheduleCardView } from "./counsellor-schedule-card";
import type { CounsellorMoveOutcome } from "./move-schedule";
import {
  approveScheduleAction,
  markScheduleDoneAction,
  markScheduleMissedAction,
  proposeScheduleAction,
  rescheduleScheduleAction,
} from "./schedule-actions";
import type { SentProposal } from "./schedule-rules";
import { ScheduleTimeForm } from "./schedule-time-form";
import type { CounsellorScheduleCard } from "./schedule-view";
import { DONE_QUESTION, MISSED_QUESTION } from "./schedule-words";

const NO_MESSAGE: FormState = { error: null, done: null };

function messageOf(outcome: CounsellorMoveOutcome): FormState {
  if (outcome.kind === "kept") return { error: null, done: outcome.done };
  return { error: outcome.error, done: null };
}

function proposalOf(form: FormData): SentProposal {
  return {
    day: text(form, "day"),
    hour: text(form, "hour"),
    way: text(form, "way"),
    message: text(form, "message"),
  };
}

/** Which time form a card shows: none, "Usulkan waktu lain" or "Ubah jadwal". */
type OpenForm = "propose" | "reschedule" | null;

/** What each time form sends with, and what its send button says. */
const TIME_FORMS = {
  propose: { send: proposeScheduleAction, words: "Kirim usulan ke mahasiswa" },
  reschedule: { send: rescheduleScheduleAction, words: "Simpan jadwal" },
};

/**
 * One request on Konselor's "Jadwal konseling", with "Setujui waktu ini"
 * and "Usulkan waktu lain" while it is Diajukan, and "Tandai selesai",
 * "Tidak hadir" and "Ubah jadwal" once it is Dijadwalkan. Marking asks
 * first. After a press the card shows the request as the server gave it
 * back, also when the press was refused because someone changed it
 * first.
 */
export function CounsellorScheduleItem({
  card: first,
}: {
  card: CounsellorScheduleCard;
}) {
  const [card, setCard] = useState(first);
  const [message, setMessage] = useState<FormState>(NO_MESSAGE);
  const [openForm, setOpenForm] = useState<OpenForm>(null);
  const [pending, startSending] = useTransition();

  function answered(outcome: CounsellorMoveOutcome) {
    setMessage(messageOf(outcome));
    if (outcome.kind === "refused") return;
    if (outcome.card) setCard(outcome.card);
    setOpenForm(null);
  }

  function press(
    action: (id: string, version: string) => Promise<CounsellorMoveOutcome>,
    question?: string,
  ) {
    if (question && !window.confirm(question)) return;
    startSending(async () => {
      answered(await action(card.id, card.version));
    });
  }

  function sendTime(form: FormData) {
    if (openForm === null) return;
    const { send } = TIME_FORMS[openForm];
    startSending(async () => {
      answered(await send(card.id, card.version, proposalOf(form)));
    });
  }

  function open(form: OpenForm) {
    setMessage(NO_MESSAGE);
    setOpenForm(form);
  }

  const waits = card.status === "submitted";
  const isScheduled = card.status === "scheduled";
  return (
    <CounsellorScheduleCardView card={card}>
      {waits && openForm === null && (
        <div className={shared.actions}>
          <button
            type="button"
            className={shared.button}
            disabled={pending}
            onClick={() => press(approveScheduleAction)}
          >
            Setujui waktu ini
          </button>
          <button
            type="button"
            className={shared.quiet}
            disabled={pending}
            onClick={() => open("propose")}
          >
            Usulkan waktu lain
          </button>
        </div>
      )}
      {isScheduled && openForm === null && (
        <div className={shared.actions}>
          <button
            type="button"
            className={shared.button}
            disabled={pending}
            onClick={() => press(markScheduleDoneAction, DONE_QUESTION)}
          >
            Tandai selesai
          </button>
          <button
            type="button"
            className={shared.quiet}
            disabled={pending}
            onClick={() => press(markScheduleMissedAction, MISSED_QUESTION)}
          >
            Tidak hadir
          </button>
          <button
            type="button"
            className={shared.link}
            disabled={pending}
            onClick={() => open("reschedule")}
          >
            Ubah jadwal
          </button>
        </div>
      )}
      {openForm !== null && (waits || isScheduled) && (
        <ScheduleTimeForm
          card={card}
          sendWords={TIME_FORMS[openForm].words}
          pending={pending}
          onSend={sendTime}
          onCancel={() => setOpenForm(null)}
        />
      )}
      <FormMessage state={message} />
    </CounsellorScheduleCardView>
  );
}
