"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  OLD_MENTOR_STATUSES,
  REPLACEMENT_REASON_TITLES,
  REPLACEMENT_REASONS,
} from "@/mentoring/replacement-ids";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { MENTOR_STATUS_TITLES } from "@/ui/mentor-status";
import { sendForm } from "@/ui/send-form";
import { NOTE_MAX_LENGTH } from "./evaluation-input";
import styles from "./mentor-groups.module.css";
import { saveReplacementAction } from "./replacement-actions";
import { CONFIRMED, LETTER_NUMBER_MAX } from "./replacement-input";
import {
  startOfReplacement,
  withOldStatus,
  withReason,
} from "./replacement-typed";
import {
  alreadyScheduledWords,
  confirmWords,
  needsPoorEvaluationWords,
} from "./replacement-words";
import type { SpareChoice } from "./spare-choices";

const START: FormState = { error: null, done: null };

/** Where accounts get the Pengasuh role. */
const USERS_ADDRESS = "/pengaturan/pengguna";

/** What the form shows of the group whose mentor is replaced. */
export interface ReplacedGroup {
  id: string;
  code: string;
  /** How many Aktif students the group holds. */
  members: number;
  oldMentorName: string;
  /** Whether the old mentor's last evaluation for the group is Kurang. */
  hasPoorEvaluation: boolean;
  /** The address of the form that evaluates the old mentor. */
  evaluationAddress: string;
  /**
   * The start date of the replacement of the group that waits already,
   * or null for a group without one.
   */
  waitingFrom: string | null;
}

function NewMentorField({
  choices,
  value,
  onChoose,
}: {
  choices: SpareChoice[];
  value: string;
  onChoose: (id: string) => void;
}) {
  const hasNone = choices.length === 0;
  return (
    <label className={`${shared.field} ${styles.whole}`}>
      Pengasuh pengganti
      <select
        name="newMentorId"
        className={`${shared.input} ${styles.fit}`}
        value={value}
        onChange={(event) => onChoose(event.target.value)}
      >
        <option value="">
          {hasNone ? "Tidak ada pengasuh cadangan" : "Pilih pengasuh cadangan"}
        </option>
        {choices.map((choice) => (
          <option key={choice.id} value={choice.id}>
            {choice.label}
          </option>
        ))}
      </select>
      {hasNone && (
        <small className={shared.detail}>
          Beri peran Pengasuh kepada akun pegawai di{" "}
          <Link href={USERS_ADDRESS} className={shared.link}>
            Pengguna dan peran
          </Link>
          .
        </small>
      )}
    </label>
  );
}

/**
 * The form of a replacement for one group: the reason, the start date,
 * the spare mentor, the letter number, what the old mentor becomes, the
 * note, and the tick box whose sentence says what the replacement does.
 * The button is off while a save is on its way, so two presses save once,
 * while Hasil evaluasi kurang has no evaluation to stand on, and while
 * the group has a replacement that waits already. After a save the fields
 * start again.
 */
export function ReplacementForm({
  group,
  choices,
  today,
}: {
  group: ReplacedGroup;
  /** The spare mentors, those of the old mentor's unit first. */
  choices: SpareChoice[];
  /** The day on campus, which "Tanggal efektif" starts with. */
  today: string;
}) {
  const [state, save, pending] = useActionState(saveReplacementAction, START);
  const [typed, setTyped] = useState(() => startOfReplacement(today));
  const [answered, setAnswered] = useState(state);
  if (state !== answered) {
    setAnswered(state);
    if (state.done !== null) setTyped(startOfReplacement(today));
  }
  const needsEvaluation =
    typed.reason === "poor_evaluation" && !group.hasPoorEvaluation;
  const newMentor = choices.find((choice) => choice.id === typed.newMentorId);

  return (
    // noValidate: the server says what is missing, in the words of the app.
    <form
      onSubmit={(event) => sendForm(event, save)}
      className={shared.form}
      noValidate
    >
      <input type="hidden" name="groupId" value={group.id} />
      {group.waitingFrom !== null && (
        <p className={`${styles.outcome} ${styles.warned} ${styles.whole}`}>
          {alreadyScheduledWords(group.waitingFrom)}
        </p>
      )}
      <label className={shared.field}>
        Alasan penggantian
        <select
          name="reason"
          className={`${shared.input} ${styles.fit}`}
          value={typed.reason}
          onChange={(event) => setTyped(withReason(typed, event.target.value))}
        >
          {REPLACEMENT_REASONS.map((reason) => (
            <option key={reason} value={reason}>
              {REPLACEMENT_REASON_TITLES[reason]}
            </option>
          ))}
        </select>
      </label>
      <label className={shared.field}>
        Tanggal efektif
        <input
          name="startsOn"
          type="date"
          className={shared.input}
          min={today}
          value={typed.startsOn}
          onChange={(event) =>
            setTyped({ ...typed, startsOn: event.target.value })
          }
        />
      </label>
      {needsEvaluation && (
        <p className={`${styles.outcome} ${styles.warned} ${styles.whole}`}>
          {needsPoorEvaluationWords(group.code)}{" "}
          <Link href={group.evaluationAddress} className={shared.link}>
            Lakukan evaluasi dulu
          </Link>
        </p>
      )}
      <NewMentorField
        choices={choices}
        value={typed.newMentorId}
        onChoose={(newMentorId) => setTyped({ ...typed, newMentorId })}
      />
      <label className={shared.field}>
        Nomor surat keputusan atau nota dinas
        <input
          name="letterNumber"
          className={shared.input}
          maxLength={LETTER_NUMBER_MAX}
          placeholder="Misalnya KEP-123/PKN/2026"
          value={typed.letterNumber}
          onChange={(event) =>
            setTyped({ ...typed, letterNumber: event.target.value })
          }
        />
      </label>
      <label className={shared.field}>
        Status pengasuh lama
        <select
          name="oldMentorStatus"
          className={`${shared.input} ${styles.fit}`}
          value={typed.oldStatus.status}
          onChange={(event) =>
            setTyped(withOldStatus(typed, event.target.value))
          }
        >
          {OLD_MENTOR_STATUSES.map((status) => (
            <option key={status} value={status}>
              {MENTOR_STATUS_TITLES[status]}
            </option>
          ))}
        </select>
      </label>
      <label className={`${shared.field} ${styles.whole}`}>
        Keterangan
        <textarea
          name="note"
          className={shared.input}
          rows={3}
          maxLength={NOTE_MAX_LENGTH}
          placeholder="Pertimbangan penggantian"
          value={typed.note}
          onChange={(event) => setTyped({ ...typed, note: event.target.value })}
        />
      </label>
      <label className={styles.confirm}>
        <input
          type="checkbox"
          name="confirmed"
          value={CONFIRMED}
          checked={typed.isConfirmed}
          onChange={(event) =>
            setTyped({ ...typed, isConfirmed: event.target.checked })
          }
        />
        <span>
          {confirmWords({
            members: group.members,
            groupCode: group.code,
            oldMentorName: group.oldMentorName,
            newMentorName: newMentor?.name ?? null,
            startsOn: typed.startsOn,
            today,
          })}
        </span>
      </label>
      <div className={shared.actions}>
        <button
          type="submit"
          className={shared.button}
          disabled={pending || needsEvaluation || group.waitingFrom !== null}
        >
          Tetapkan penggantian
        </button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
