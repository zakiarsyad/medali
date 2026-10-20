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
import { useScheduleNotice } from "./schedule-notice";
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

/**
 * What each time form sends with, what its send button says, and whether
 * the page is drawn again after it.
 */
const TIME_FORMS = {
  propose: {
    send: proposeScheduleAction,
    words: "Kirim usulan ke mahasiswa",
    redraws: false,
  },
  reschedule: {
    send: rescheduleScheduleAction,
    words: "Simpan jadwal",
    redraws: true,
  },
};

/**
 * One request on Konselor's "Jadwal konseling", with "Setujui waktu ini"
 * and "Usulkan waktu lain" while it is Diajukan, and "Tandai selesai",
 * "Tidak hadir" and "Ubah jadwal" once it is Dijadwalkan. Marking asks
 * first. After a press the card shows the request as the server gave it
 * back, also when the press was refused because someone changed it
 * first. A move or a mark draws the page again, which may take the card
 * away, so what it did is said above the cards.
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
  const announce = useScheduleNotice();

  function answered(outcome: CounsellorMoveOutcome, redraws: boolean) {
    const said = messageOf(outcome);
    const isKeptAway = redraws && outcome.kind !== "refused";
    setMessage(isKeptAway ? NO_MESSAGE : said);
    if (isKeptAway) announce(said);
    if (outcome.kind === "refused") return;
    if (outcome.card) setCard(outcome.card);
    setOpenForm(null);
  }

  function press(
    action: (id: string, version: string) => Promise<CounsellorMoveOutcome>,
    redraws: boolean,
    question?: string,
  ) {
    if (question && !window.confirm(question)) return;
    announce(null);
    startSending(async () => {
      answered(await action(card.id, card.version), redraws);
    });
  }

  function sendTime(form: FormData) {
    if (openForm === null) return;
    const { send, redraws } = TIME_FORMS[openForm];
    announce(null);
    startSending(async () => {
      answered(await send(card.id, card.version, proposalOf(form)), redraws);
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
            onClick={() => press(approveScheduleAction, false)}
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
            onClick={() => press(markScheduleDoneAction, true, DONE_QUESTION)}
          >
            Tandai selesai
          </button>
          <button
            type="button"
            className={shared.quiet}
            disabled={pending}
            onClick={() =>
              press(markScheduleMissedAction, true, MISSED_QUESTION)
            }
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
