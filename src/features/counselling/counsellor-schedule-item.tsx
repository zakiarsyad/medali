"use client";

import { type FormEvent, useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { text } from "@/ui/form-data";
import { FormMessage, type FormState } from "@/ui/form-message";
import styles from "./counselling.module.css";
import { CounsellorScheduleCardView } from "./counsellor-schedule-card";
import type { CounsellorMoveOutcome } from "./move-schedule";
import {
  approveScheduleAction,
  proposeScheduleAction,
} from "./schedule-actions";
import { COUNSELLING_HOURS, COUNSELLING_WAYS, NOTE_MAX } from "./schedule-ids";
import { ChoiceOptions } from "./schedule-options";
import type { CounsellorScheduleCard } from "./schedule-view";
import { COUNSELLING_WAY_WORDS } from "./schedule-words";

const NO_MESSAGE: FormState = { error: null, done: null };

function messageOf(outcome: CounsellorMoveOutcome): FormState {
  if (outcome.kind === "kept") return { error: null, done: outcome.done };
  return { error: outcome.error, done: null };
}

/** "Usulkan waktu lain": Tanggal, Jam, Cara and "Pesan untuk mahasiswa". */
function ProposeForm({
  card,
  pending,
  onSend,
  onCancel,
}: {
  card: CounsellorScheduleCard;
  pending: boolean;
  onSend: (form: FormData) => void;
  onCancel: () => void;
}) {
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSend(new FormData(event.currentTarget));
  }

  // noValidate: a wrong day gets the app's own message.
  return (
    <form onSubmit={send} className={shared.form} noValidate>
      <label className={shared.field}>
        Tanggal
        <input
          name="day"
          type="date"
          className={shared.input}
          defaultValue={card.day}
        />
      </label>
      <label className={shared.field}>
        Jam
        <select name="hour" className={shared.input} defaultValue={card.hour}>
          <ChoiceOptions choices={COUNSELLING_HOURS} />
        </select>
      </label>
      <label className={`${shared.field} ${styles.full}`}>
        Cara
        <select name="way" className={shared.input} defaultValue={card.way}>
          <ChoiceOptions
            choices={COUNSELLING_WAYS}
            words={COUNSELLING_WAY_WORDS}
          />
        </select>
      </label>
      <label className={`${shared.field} ${styles.full}`}>
        Pesan untuk mahasiswa
        <input
          name="message"
          className={shared.input}
          placeholder="Opsional"
          maxLength={NOTE_MAX}
        />
      </label>
      <div className={`${shared.actions} ${styles.full}`}>
        <button type="submit" className={shared.button} disabled={pending}>
          Kirim usulan ke mahasiswa
        </button>
        <button
          type="button"
          className={shared.quiet}
          disabled={pending}
          onClick={onCancel}
        >
          Batal
        </button>
      </div>
    </form>
  );
}

/**
 * One request on Konselor's "Jadwal konseling", with "Setujui waktu ini"
 * and "Usulkan waktu lain" while it is Diajukan. After a press the card
 * shows the request as the server gave it back, also when the press was
 * refused because someone changed it first.
 */
export function CounsellorScheduleItem({
  card: first,
}: {
  card: CounsellorScheduleCard;
}) {
  const [card, setCard] = useState(first);
  const [message, setMessage] = useState<FormState>(NO_MESSAGE);
  const [isProposing, setProposing] = useState(false);
  const [pending, startSending] = useTransition();

  function answered(outcome: CounsellorMoveOutcome) {
    setMessage(messageOf(outcome));
    if (outcome.kind === "refused") return;
    if (outcome.card) setCard(outcome.card);
    setProposing(false);
  }

  function approve() {
    startSending(async () => {
      answered(await approveScheduleAction(card.id, card.version));
    });
  }

  function propose(form: FormData) {
    startSending(async () => {
      const outcome = await proposeScheduleAction(card.id, card.version, {
        day: text(form, "day"),
        hour: text(form, "hour"),
        way: text(form, "way"),
        message: text(form, "message"),
      });
      answered(outcome);
    });
  }

  const waits = card.status === "submitted";
  return (
    <CounsellorScheduleCardView card={card}>
      {waits && !isProposing && (
        <div className={shared.actions}>
          <button
            type="button"
            className={shared.button}
            disabled={pending}
            onClick={approve}
          >
            Setujui waktu ini
          </button>
          <button
            type="button"
            className={shared.quiet}
            disabled={pending}
            onClick={() => {
              setMessage(NO_MESSAGE);
              setProposing(true);
            }}
          >
            Usulkan waktu lain
          </button>
        </div>
      )}
      {waits && isProposing && (
        <ProposeForm
          card={card}
          pending={pending}
          onSend={propose}
          onCancel={() => setProposing(false)}
        />
      )}
      <FormMessage state={message} />
    </CounsellorScheduleCardView>
  );
}
