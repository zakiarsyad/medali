"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { useAskBeforeLeaving } from "@/ui/ask-before-leaving";
import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import styles from "./activities.module.css";
import type { ActivityRow } from "./activity-row";
import { saveCountAction } from "./count-actions";
import type { CountFormState } from "./count-form-state";
import { type CountMark, type CountMarks, NOTE_MAX_LENGTH } from "./count-ids";
import type { CountIntent } from "./count-input";
import {
  absentCount,
  type KeptCount,
  marksFor,
  NOT_COUNTED_YET,
  type Participant,
  sameMarks,
  shownParticipants,
  withoutLeaveAbsences,
} from "./count-view";
import { absentWords, announceQuestion, countStatusWords } from "./count-words";
import type { LeaveMark, LeaveMarks } from "./leave-marks";

export const LEAVE_QUESTION =
  "Perubahan penghitungan belum disimpan. Tinggalkan tanpa menyimpan?";

function roomWords(participant: Participant): string {
  if (participant.room === null) return "Belum diplot";
  return `Kamar ${participant.room}`;
}

const LEAVE_BADGE_WORDS: Record<LeaveMark, string> = {
  leave: "Izin",
  itmk: "Hadir · ITMK",
};

function ParticipantRow({
  participant,
  mark,
  onLeave,
  onMark,
}: {
  participant: Participant;
  mark: CountMark;
  /** What approved leave makes of them here, or null for none. */
  onLeave: LeaveMark | null;
  onMark: (mark: CountMark) => void;
}) {
  const { name } = participant;
  return (
    <li className={styles.countRow}>
      <span className={styles.countWho}>
        <b>{name}</b>
        <span className={shared.detail}>
          {participant.nim} · {roomWords(participant)}
        </span>
        {onLeave && (
          <span className={`${shared.badge} ${styles.plain}`}>
            {LEAVE_BADGE_WORDS[onLeave]}
          </span>
        )}
      </span>
      <label className={styles.countAbsent}>
        {/* Approved leave decides how they count: they cannot be ticked. */}
        <input
          type="checkbox"
          checked={mark.isAbsent}
          disabled={onLeave !== null}
          onChange={(event) =>
            onMark({ ...mark, isAbsent: event.target.checked })
          }
          aria-label={`Tidak hadir ${name}`}
        />
        Tidak hadir
      </label>
      <input
        className={`${shared.input} ${styles.countNote}`}
        value={mark.note}
        maxLength={NOTE_MAX_LENGTH}
        placeholder="Catatan (opsional)"
        aria-label={`Catatan ${name}`}
        onChange={(event) => onMark({ ...mark, note: event.target.value })}
      />
    </li>
  );
}

/** The form as it is sent: the absent, and each note beside its student. */
function sentForm(
  parts: { activityId: string; day: string; version: number },
  intent: CountIntent,
  marks: CountMarks,
): FormData {
  const form = new FormData();
  form.set("activityId", parts.activityId);
  form.set("day", parts.day);
  form.set("version", String(parts.version));
  form.set("intent", intent);
  for (const [id, mark] of Object.entries(marks)) {
    if (mark.isAbsent) form.append("absent", id);
    if (mark.note.trim() === "") continue;
    form.append("noteStudent", id);
    form.append("noteText", mark.note);
  }
  return form;
}

/**
 * The count of one activity on one day: a row for each participant with
 * "Tidak hadir" and Catatan, a search and a filter, a count that follows
 * the ticks, and the buttons. Before the first announcement there are
 * "Simpan" and "Umumkan ketidakhadiran"; after it only "Umumkan ulang".
 * An announcement asks first. The form sends which save of the count it
 * was opened on, so a count saved in between is not written over, and
 * leaving with changes that are not saved asks first.
 */
export function CountForm({
  activity,
  day,
  participants,
  kept,
  onLeave,
  onUnsaved,
}: {
  activity: ActivityRow;
  day: string;
  participants: Participant[];
  kept: KeptCount | null;
  /** The participants approved leave covers at the activity. */
  onLeave: LeaveMarks;
  /** Told whether the form holds changes that are not saved. */
  onUnsaved: (isUnsaved: boolean) => void;
}) {
  const start = withoutLeaveAbsences(
    marksFor(participants, kept?.marks ?? {}),
    onLeave,
  );
  const [marks, setMarks] = useState(start);
  const [saved, setSaved] = useState(start);
  const [typed, setTyped] = useState("");
  const [onlyMarked, setOnlyMarked] = useState(false);

  async function send(
    before: CountFormState,
    form: FormData,
  ): Promise<CountFormState> {
    const sent = marks;
    const after = await saveCountAction(before, form);
    if (after.done) setSaved(sent);
    return after;
  }

  const [state, save, pending] = useActionState(send, {
    error: null,
    done: null,
    version: kept?.version ?? NOT_COUNTED_YET,
    isAnnounced: kept !== null && kept.announcedAt !== null,
  });
  const isUnsaved = !sameMarks(saved, marks);
  useAskBeforeLeaving(isUnsaved, LEAVE_QUESTION);
  useEffect(() => {
    onUnsaved(isUnsaved);
    return () => onUnsaved(false);
  }, [isUnsaved, onUnsaved]);

  const absent = absentCount(marks);
  function press(intent: CountIntent) {
    const isAnnouncement = intent === "announce";
    const question = announceQuestion(absent, activity.name, state.isAnnounced);
    if (isAnnouncement && !window.confirm(question)) return;
    const parts = { activityId: activity.id, day, version: state.version };
    startTransition(() => save(sentForm(parts, intent, marks)));
  }

  const shown = shownParticipants(participants, marks, typed, onlyMarked);
  return (
    <div className={styles.countForm}>
      <p className={state.isAnnounced ? styles.note : styles.warnNote}>
        {countStatusWords(kept)}{" "}
        <b role="status">{absentWords(absent, participants.length)}</b>
      </p>
      <div className={shared.filters}>
        <input
          type="search"
          className={shared.input}
          value={typed}
          placeholder="Cari nama atau NIM"
          aria-label="Cari nama atau NIM"
          onChange={(event) => setTyped(event.target.value)}
        />
        <label className={styles.countAbsent}>
          <input
            type="checkbox"
            checked={onlyMarked}
            onChange={(event) => setOnlyMarked(event.target.checked)}
          />
          Hanya tidak hadir atau bercatatan
        </label>
      </div>
      {shown.length === 0 ? (
        <p className={shared.empty}>Tidak ada peserta yang cocok.</p>
      ) : (
        <ul className={styles.countList}>
          {shown.map((participant) => (
            <ParticipantRow
              key={participant.id}
              participant={participant}
              mark={marks[participant.id] ?? { isAbsent: false, note: "" }}
              onLeave={onLeave[participant.id] ?? null}
              onMark={(mark) => setMarks({ ...marks, [participant.id]: mark })}
            />
          ))}
        </ul>
      )}
      <div className={styles.countBar}>
        <div className={shared.actions}>
          {!state.isAnnounced && (
            <button
              type="button"
              className={shared.quiet}
              disabled={pending}
              onClick={() => press("draft")}
            >
              Simpan
            </button>
          )}
          <button
            type="button"
            className={shared.button}
            disabled={pending}
            onClick={() => press("announce")}
          >
            {state.isAnnounced ? "Umumkan ulang" : "Umumkan ketidakhadiran"}
          </button>
          {isUnsaved && (
            <span className={styles.quietLine}>Belum disimpan.</span>
          )}
        </div>
        <FormMessage state={state} />
      </div>
    </div>
  );
}
