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
} from "./own-schedule-actions";
import { OwnScheduleCard } from "./own-schedule-card";
import { COUNSELLING_HOURS, NOTE_MAX } from "./schedule-ids";
import { ChoiceOptions } from "./schedule-options";
import type { OwnScheduleView } from "./schedule-view";

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

/**
 * One request of the student, with "Terima jadwal ini" and "Minta waktu
 * lain" while Konselor's proposal waits for them. The page is drawn again
 * after an answer, so `schedule` is always the request as it is now.
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

  function answered(outcome: StudentMoveOutcome) {
    setMessage(messageOf(outcome));
    if (outcome.kind !== "refused") setAsking(false);
  }

  function accept() {
    startSending(async () => {
      answered(await acceptScheduleAction(schedule.id, schedule.version));
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

  const waits = schedule.status === "proposed";
  return (
    <OwnScheduleCard schedule={schedule}>
      {waits && (
        <div className={shared.actions}>
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
            onClick={() => {
              setMessage(NO_MESSAGE);
              setAsking(true);
            }}
          >
            Minta waktu lain
          </button>
        </div>
      )}
      {waits && isAsking && (
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
