"use client";

import { useState, useTransition } from "react";
import { NEEDS_CONSENT } from "@/mental-health/session-words";
import shared from "@/ui/data-screen.module.css";
import { text } from "@/ui/form-data";
import { FormMessage, type FormState } from "@/ui/form-message";
import { sentOr } from "@/ui/save-not-sent";
import styles from "./counselling.module.css";
import { CounsellorScheduleCardView } from "./counsellor-schedule-card";
import type { CounsellorMoveOutcome } from "./move-schedule";
import { refusedOutcome } from "./not-sent";
import {
  approveScheduleAction,
  markScheduleDoneAction,
  markScheduleMissedAction,
  proposeScheduleAction,
  rescheduleScheduleAction,
  setScheduleTimeAction,
} from "./schedule-actions";
import {
  NO_SESSION,
  useScheduleNotice,
  useScheduleSession,
} from "./schedule-notice";
import type { SentProposal } from "./schedule-rules";
import { ScheduleTimeForm } from "./schedule-time-form";
import type { CounsellorScheduleCard } from "./schedule-view";
import { DONE_QUESTION, MISSED_QUESTION } from "./schedule-words";
import { scheduleSessionAction } from "./session-actions";

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

/**
 * Which time form a card shows: none, "Usulkan waktu lain", "Ubah
 * jadwal" or "Tetapkan jadwal".
 */
type OpenForm = "propose" | "reschedule" | "set_time" | null;

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
  set_time: {
    send: setScheduleTimeAction,
    words: "Simpan jadwal",
    redraws: true,
  },
};

/**
 * One request on Konselor's "Jadwal konseling", with "Setujui waktu ini"
 * and "Usulkan waktu lain" while it is Diajukan, "Tetapkan jadwal" while
 * an assignment is Menunggu jadwal, "Setujui waktu ini" and "Tetapkan
 * jadwal" while it is Minta jadwal ulang, and "Tandai selesai",
 * "Tidak hadir" and "Ubah jadwal" once it is Dijadwalkan. Marking asks
 * first. After a press the card shows the request as the server gave it
 * back, also when the press was refused because someone changed it
 * first. A move or a mark draws the page again, which may take the card
 * away, so what it did is said above the cards. For an account that may
 * keep sessions, "Tandai selesai" also opens "Catat sesi" there, and a
 * Dijadwalkan card of a student whose consent is not Disetujui says
 * that consent is needed first.
 */
export function CounsellorScheduleItem({
  card: first,
  mayKeepSessions = false,
}: {
  card: CounsellorScheduleCard;
  mayKeepSessions?: boolean;
}) {
  const [card, setCard] = useState(first);
  const [message, setMessage] = useState<FormState>(NO_MESSAGE);
  const [openForm, setOpenForm] = useState<OpenForm>(null);
  const [pending, startSending] = useTransition();
  const announce = useScheduleNotice();
  const [, showSession] = useScheduleSession();

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
    showSession(NO_SESSION);
    startSending(async () => {
      answered(
        await sentOr(() => action(card.id, card.version), refusedOutcome),
        redraws,
      );
    });
  }

  function markDone() {
    if (!window.confirm(DONE_QUESTION)) return;
    announce(null);
    showSession(NO_SESSION);
    startSending(async () => {
      const outcome = await sentOr(
        () => markScheduleDoneAction(card.id, card.version),
        refusedOutcome,
      );
      answered(outcome, true);
      if (outcome.kind !== "kept" || !mayKeepSessions) return;
      showSession(await scheduleSessionAction(card.id));
    });
  }

  function sendTime(form: FormData) {
    if (openForm === null) return;
    const { send, redraws } = TIME_FORMS[openForm];
    announce(null);
    showSession(NO_SESSION);
    startSending(async () => {
      answered(
        await sentOr(
          () => send(card.id, card.version, proposalOf(form)),
          refusedOutcome,
        ),
        redraws,
      );
    });
  }

  function open(form: OpenForm) {
    setMessage(NO_MESSAGE);
    setOpenForm(form);
  }

  const waits = card.status === "submitted";
  const isScheduled = card.status === "scheduled";
  const toSet =
    card.status === "awaiting" || card.status === "reschedule_asked";
  return (
    <CounsellorScheduleCardView card={card}>
      {toSet && openForm === null && (
        <div className={shared.actions}>
          {card.status === "reschedule_asked" && (
            <button
              type="button"
              className={shared.button}
              disabled={pending}
              onClick={() => press(approveScheduleAction, false)}
            >
              Setujui waktu ini
            </button>
          )}
          <button
            type="button"
            className={
              card.status === "awaiting" ? shared.button : shared.quiet
            }
            disabled={pending}
            onClick={() => open("set_time")}
          >
            Tetapkan jadwal
          </button>
        </div>
      )}
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
            onClick={markDone}
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
      {isScheduled && mayKeepSessions && !card.hasConsent && (
        <p className={styles.sub}>{NEEDS_CONSENT}</p>
      )}
      {openForm !== null && (waits || isScheduled || toSet) && (
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
