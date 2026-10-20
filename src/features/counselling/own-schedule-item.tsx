"use client";

import { type FormEvent, useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { text } from "@/ui/form-data";
import { FormMessage, type FormState } from "@/ui/form-message";
import styles from "./counselling.module.css";
import type { StudentMoveOutcome } from "./move-schedule";
import {
  acceptScheduleAction,
  askAnotherTimeAction,
  cancelScheduleAction,
} from "./own-schedule-actions";
import { OwnScheduleCard } from "./own-schedule-card";
import { COUNSELLING_HOURS, NOTE_MAX } from "./schedule-ids";
import { useScheduleNotice } from "./schedule-notice";
import { ChoiceOptions } from "./schedule-options";
import type { OwnScheduleView } from "./schedule-view";
import { CANCEL_QUESTION } from "./schedule-words";

const NO_MESSAGE: FormState = { error: null, done: null };

function messageOf(outcome: StudentMoveOutcome): FormState {
  if (outcome.kind === "kept") return { error: null, done: outcome.done };
  return { error: outcome.error, done: null };
}

/** "Minta waktu lain": Tanggal from tomorrow, Jam and Alasan. */
function AnotherTimeForm({
  tomorrow,
  pending,
  onSend,
}: {
  tomorrow: string;
  pending: boolean;
  onSend: (form: FormData) => void;
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
          min={tomorrow}
          defaultValue={tomorrow}
        />
      </label>
      <label className={shared.field}>
        Jam
        <select name="hour" className={shared.input}>
          <ChoiceOptions choices={COUNSELLING_HOURS} />
        </select>
      </label>
      <label className={`${shared.field} ${styles.full}`}>
        Alasan
        <input
          name="reason"
          className={shared.input}
          placeholder="Misalnya bentrok dengan ujian"
          maxLength={NOTE_MAX}
        />
      </label>
      <div className={`${shared.actions} ${styles.full}`}>
        <button type="submit" className={shared.button} disabled={pending}>
          Kirim permintaan
        </button>
      </div>
    </form>
  );
}

/** Whether the student may ask for another time: on a proposal or a session. */
function canAskAnother(schedule: OwnScheduleView): boolean {
  return schedule.status === "proposed" || schedule.status === "scheduled";
}

/**
 * One request of the student. While Konselor's proposal waits for them:
 * "Terima jadwal ini", "Minta waktu lain" and "Batalkan pendaftaran".
 * While it is Diajukan: "Batalkan pendaftaran". Once it is Dijadwalkan:
 * "Minta jadwal ulang" and "Batalkan". Cancelling asks first. The page is
 * drawn again after an answer, so `schedule` is always the request as it
 * is now.
 */
export function OwnScheduleItem({
  schedule,
  tomorrow,
}: {
  schedule: OwnScheduleView;
  tomorrow: string;
}) {
  const [message, setMessage] = useState<FormState>(NO_MESSAGE);
  const [isAsking, setAsking] = useState(false);
  const [pending, startSending] = useTransition();
  const announce = useScheduleNotice();

  function answered(outcome: StudentMoveOutcome) {
    setMessage(messageOf(outcome));
    if (outcome.kind !== "refused") setAsking(false);
  }

  function accept() {
    startSending(async () => {
      answered(await acceptScheduleAction(schedule.id, schedule.version));
    });
  }

  // A kept cancel takes the card out of the list, and a change made
  // since may too, so what happened is said above the cards.
  function cancel() {
    if (!window.confirm(CANCEL_QUESTION)) return;
    announce(null);
    startSending(async () => {
      const outcome = await cancelScheduleAction(schedule.id, schedule.version);
      if (outcome.kind === "refused") {
        answered(outcome);
        return;
      }
      setMessage(NO_MESSAGE);
      announce(messageOf(outcome));
    });
  }

  function askAnother(form: FormData) {
    startSending(async () => {
      const outcome = await askAnotherTimeAction(
        schedule.id,
        schedule.version,
        {
          day: text(form, "day"),
          hour: text(form, "hour"),
          reason: text(form, "reason"),
        },
      );
      answered(outcome);
    });
  }

  function openAsking() {
    setMessage(NO_MESSAGE);
    setAsking(true);
  }

  const { status } = schedule;
  const isScheduled = status === "scheduled";
  return (
    <OwnScheduleCard schedule={schedule}>
      <div className={shared.actions}>
        {status === "proposed" && (
          <>
            <button
              type="button"
              className={shared.button}
              disabled={pending}
              onClick={accept}
            >
              Terima jadwal ini
            </button>
            <button
              type="button"
              className={shared.quiet}
              disabled={pending}
              onClick={openAsking}
            >
              Minta waktu lain
            </button>
          </>
        )}
        {isScheduled && (
          <button
            type="button"
            className={shared.quiet}
            disabled={pending}
            onClick={openAsking}
          >
            Minta jadwal ulang
          </button>
        )}
        <button
          type="button"
          className={shared.link}
          disabled={pending}
          onClick={cancel}
        >
          {isScheduled ? "Batalkan" : "Batalkan pendaftaran"}
        </button>
      </div>
      {canAskAnother(schedule) && isAsking && (
        <AnotherTimeForm
          tomorrow={tomorrow}
          pending={pending}
          onSend={askAnother}
        />
      )}
      <FormMessage state={message} />
    </OwnScheduleCard>
  );
}
