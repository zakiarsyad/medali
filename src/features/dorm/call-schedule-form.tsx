"use client";

import { unstable_rethrow } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import styles from "./violations.module.css";
import { scheduleWarningCallAction } from "./warning-actions";
import {
  type CallSchedule,
  PLACE_MAX_LENGTH,
  type WarningLevel,
} from "./warning-ids";
import { parseCallSchedule } from "./warning-input";

/** Said when the call did not reach the server, or no answer came back. */
export const CALL_NOT_SENT =
  "Panggilan tidak terkirim. Periksa koneksi internet, lalu coba lagi.";

const NOTHING: FormState = { error: null, done: null };

/**
 * "1. Jadwalkan klarifikasi": Tanggal, Jam and Tempat of the call, and
 * "Kirim panggilan", or "Ubah jadwal" once it is sent. A schedule the
 * server would refuse is answered at once and sent nowhere. While it is
 * on its way the fields are switched off, so a second press sends
 * nothing more.
 */
export function CallScheduleForm({
  studentId,
  level,
  shown,
  isSent,
  firstDay,
  lastDay,
}: {
  studentId: string;
  level: WarningLevel;
  /** The call already sent, or the one the form offers to start with. */
  shown: CallSchedule;
  /** Whether a call was sent already. */
  isSent: boolean;
  /** Today and the last day a call may be held, for the calendar. */
  firstDay: string;
  lastDay: string;
}) {
  const [day, setDay] = useState(shown.day);
  const [time, setTime] = useState(shown.time);
  const [place, setPlace] = useState(shown.place);
  const [answer, setAnswer] = useState(NOTHING);
  const [busy, startSending] = useTransition();
  // Set at the press itself: `busy` is known only once the form is drawn
  // again, and a second press can come before that.
  const isOnItsWay = useRef(false);

  function send() {
    const checked = parseCallSchedule({ day, time, place }, new Date());
    if (!checked.ok) return setAnswer({ error: checked.error, done: null });
    if (isOnItsWay.current) return;
    isOnItsWay.current = true;
    startSending(async () => {
      try {
        setAnswer(
          await scheduleWarningCallAction({
            studentId,
            level,
            day,
            time,
            place,
          }),
        );
      } catch (error) {
        unstable_rethrow(error);
        setAnswer({ error: CALL_NOT_SENT, done: null });
      } finally {
        isOnItsWay.current = false;
      }
    });
  }

  return (
    <div className={shared.form}>
      <label className={`${shared.field} ${styles.field}`}>
        Tanggal
        <input
          type="date"
          className={shared.input}
          value={day}
          min={firstDay}
          max={lastDay}
          disabled={busy}
          onChange={(event) => setDay(event.target.value)}
        />
      </label>
      <label className={`${shared.field} ${styles.field}`}>
        Jam
        <input
          type="time"
          className={shared.input}
          value={time}
          disabled={busy}
          onChange={(event) => setTime(event.target.value)}
        />
      </label>
      <label className={`${shared.field} ${styles.field} ${styles.full}`}>
        Tempat
        <input
          className={shared.input}
          value={place}
          maxLength={PLACE_MAX_LENGTH}
          disabled={busy}
          onChange={(event) => setPlace(event.target.value)}
        />
      </label>
      <div className={shared.actions}>
        <button
          type="button"
          className={shared.quiet}
          disabled={busy}
          onClick={send}
        >
          {isSent ? "Ubah jadwal" : "Kirim panggilan"}
        </button>
      </div>
      <FormMessage state={answer} />
    </div>
  );
}
