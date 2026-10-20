"use client";

import { type FormEvent, useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { DAY, shownDay } from "@/ui/day";
import { FormMessage } from "@/ui/form-message";
import type { ChangeOutcome } from "./change-session";
import styles from "./counselling.module.css";
import { TOPIC_WORDS } from "./schedule-words";
import { changeSessionAction } from "./session-actions";
import { SessionFields } from "./session-fields";
import type { SessionHistory, SessionView } from "./session-view";
import {
  FOLLOW_UP_WORDS,
  NO_SESSIONS,
  SESSION_KIND_WORDS,
} from "./session-words";

/** Who wrote the session down, its Tindak lanjut and its next session. */
export function sessionFacts(session: SessionView): string {
  const next = session.nextDay
    ? `, sesi berikutnya ${shownDay(session.nextDay)}`
    : "";
  return `Konselor ${session.counsellorName}. Tindak lanjut: ${FOLLOW_UP_WORDS[session.followUp]}${next}.`;
}

function ChangeForm({
  session,
  onChanged,
  onCancel,
}: {
  session: SessionView;
  onChanged: (outcome: ChangeOutcome) => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startSending] = useTransition();

  // Sent from here, not by the browser: refused notes must stay.
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startSending(async () => {
      const outcome = await changeSessionAction(
        session.id,
        session.version,
        form,
      );
      if (outcome.kind === "refused") {
        setError(outcome.error);
        return;
      }
      onChanged(outcome);
    });
  }

  return (
    // noValidate: a wrong day gets the app's own message.
    <form onSubmit={send} className={shared.form} noValidate>
      <SessionFields defaults={session} />
      <div className={`${shared.actions} ${styles.full}`}>
        <button type="submit" className={shared.button} disabled={pending}>
          Simpan perubahan
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
      <div className={styles.full}>
        <FormMessage state={{ error, done: null }} />
      </div>
    </form>
  );
}

function SessionItem({
  session,
  mayChange,
  onChanged,
}: {
  session: SessionView;
  mayChange: boolean;
  onChanged: (outcome: ChangeOutcome) => void;
}) {
  const [isChanging, setChanging] = useState(false);
  const { changed } = session;
  return (
    <li className={styles.card}>
      <b>
        {shownDay(session.day)} · {SESSION_KIND_WORDS[session.kind]} ·{" "}
        {TOPIC_WORDS[session.topic]}
      </b>
      <p className={styles.sub}>{sessionFacts(session)}</p>
      <p className={styles.notes}>{session.notes}</p>
      {changed && (
        <p className={styles.sub}>
          Diubah {DAY.format(changed.at)} oleh {changed.by}
        </p>
      )}
      {mayChange && isChanging && (
        <ChangeForm
          session={session}
          onChanged={onChanged}
          onCancel={() => setChanging(false)}
        />
      )}
      {mayChange && !isChanging && (
        <div className={shared.actions}>
          <button
            type="button"
            className={shared.link}
            onClick={() => setChanging(true)}
          >
            Ubah
          </button>
        </div>
      )}
    </li>
  );
}

/**
 * "Riwayat sesi": the student's sessions, the latest first, each with
 * its day, Jenis, Topik, Konselor, Tindak lanjut, next session, notes
 * and its last change, with "Ubah" while `mayChange`, and more on
 * request.
 */
export function SessionHistoryList({
  history,
  mayChange,
  pending,
  onMore,
  onChanged,
}: {
  history: SessionHistory;
  mayChange: boolean;
  pending: boolean;
  onMore: () => void;
  onChanged: (outcome: ChangeOutcome) => void;
}) {
  return (
    <div className={styles.stack}>
      <h3 className={shared.heading}>Riwayat sesi</h3>
      {history.items.length === 0 ? (
        <p className={styles.sub}>{NO_SESSIONS}</p>
      ) : (
        <ul className={styles.cards}>
          {history.items.map((session) => (
            <SessionItem
              key={session.id + session.version}
              session={session}
              mayChange={mayChange}
              onChanged={onChanged}
            />
          ))}
        </ul>
      )}
      {history.hasMore && (
        <div>
          <button
            type="button"
            className={shared.link}
            disabled={pending}
            onClick={onMore}
          >
            Tampilkan lebih banyak
          </button>
        </div>
      )}
    </div>
  );
}
