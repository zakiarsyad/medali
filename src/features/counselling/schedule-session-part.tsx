"use client";

import styles from "./counselling.module.css";
import {
  NO_SESSION,
  useScheduleNotice,
  useScheduleSession,
} from "./schedule-notice";
import { SessionForm } from "./session-form";
import { NEEDS_CONSENT } from "./session-words";

/**
 * Above the cards, what "Tandai selesai" opened: "Catat sesi" for that
 * schedule, or why no session can be written for it. Once the session
 * is kept the form closes, and what it did is said.
 */
export function ScheduleSessionPart() {
  const [session, showSession] = useScheduleSession();
  const announce = useScheduleNotice();
  if (session.kind === "needs_consent") {
    return <p className={styles.sub}>{NEEDS_CONSENT}</p>;
  }
  if (session.kind === "none") return null;
  const { start } = session;
  return (
    <SessionForm
      key={start.scheduleId}
      studentId={start.studentId}
      start={start}
      onSaved={(outcome) => {
        showSession(NO_SESSION);
        if (outcome.kind === "kept") {
          announce({ error: null, done: outcome.done });
        }
      }}
    />
  );
}
