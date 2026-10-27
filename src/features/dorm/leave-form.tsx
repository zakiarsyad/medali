"use client";

import { useEffect, useRef, useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { sendForm } from "@/ui/send-form";
import { SEARCH_DELAY_MS } from "@/ui/use-found";
import { useSaveState } from "@/ui/use-save-state";
import styles from "./leave.module.css";
import { askLeaveAction, describeLeaveAction } from "./leave-actions";
import {
  CONTACT_MAX_LENGTH,
  DESTINATION_MAX_LENGTH,
  LEAVE_KINDS,
  type LeaveKind,
  PURPOSE_MAX_LENGTH,
  SPECIAL_REASONS,
} from "./leave-ids";
import type { LeaveNote } from "./leave-note";
import {
  KIND_RULES,
  KIND_WORDS,
  SPECIAL_REASON_WORDS,
  timeLabels,
} from "./leave-words";

const START: FormState = { error: null, done: null };

/**
 * The note for the kind and times typed, asked from the server after a
 * pause in the typing: it knows the time on campus and the resident's
 * activities and requests. Null while a time is missing.
 */
function useLeaveNote(
  kind: LeaveKind,
  startsAt: string,
  endsAt: string,
): LeaveNote | null {
  const [note, setNote] = useState<LeaveNote | null>(null);
  useEffect(() => {
    let isLatest = true;
    const timer = setTimeout(async () => {
      const isMissing = startsAt === "" || endsAt === "";
      const answer = isMissing
        ? null
        : await describeLeaveAction(kind, startsAt, endsAt);
      // An answer to earlier times must not replace one to later times.
      if (isLatest) setNote(answer);
    }, SEARCH_DELAY_MS);
    return () => {
      isLatest = false;
      clearTimeout(timer);
    };
  }, [kind, startsAt, endsAt]);
  return note;
}

function KindChoice({
  kind,
  chosen,
  onChoose,
}: {
  kind: LeaveKind;
  chosen: LeaveKind;
  onChoose: (kind: LeaveKind) => void;
}) {
  return (
    <label className={styles.kind}>
      <input
        type="radio"
        name="kind"
        value={kind}
        checked={kind === chosen}
        onChange={() => onChoose(kind)}
      />
      <span className={styles.kindWords}>
        <b>{KIND_WORDS[kind]}</b>
        <span className={styles.kindRule}>{KIND_RULES[kind]}</span>
      </span>
    </label>
  );
}

function TimeField({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className={`${shared.field} ${styles.field}`}>
      {label}
      <input
        type="datetime-local"
        name={name}
        className={shared.input}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextField({
  label,
  name,
  maxLength,
  placeholder,
}: {
  label: string;
  name: string;
  maxLength: number;
  placeholder: string;
}) {
  return (
    <label className={`${shared.field} ${styles.field}`}>
      {label}
      <input
        name={name}
        className={shared.input}
        maxLength={maxLength}
        placeholder={placeholder}
      />
    </label>
  );
}

/**
 * "Ajukan izin": the three kinds with their rules, the times with a note
 * on their length, for ITMK the dorm activities it covers, and the
 * fields of the kind chosen. One column on a phone. After a request is
 * kept the form starts over, with a new key for the next one.
 */
export function LeaveForm({ newLeaveId }: { newLeaveId: string }) {
  const form = useRef<HTMLFormElement>(null);
  // Kept as it was when the form opened: two presses of "Ajukan izin"
  // must send the same key.
  const [id, setId] = useState(newLeaveId);
  const [kind, setKind] = useState<LeaveKind>("outing");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const note = useLeaveNote(kind, startsAt, endsAt);
  const labels = timeLabels(kind);
  const isSkipping = kind === "skip_activities";

  async function save(before: FormState, sent: FormData): Promise<FormState> {
    const after = await askLeaveAction(before, sent);
    if (after.done) {
      form.current?.reset();
      setKind("outing");
      setStartsAt("");
      setEndsAt("");
      setId(crypto.randomUUID());
    }
    return after;
  }

  const [state, action, pending] = useSaveState(save, START);

  return (
    // noValidate: the server says what is wrong, in the app's own words.
    <form ref={form} onSubmit={(event) => sendForm(event, action)} noValidate>
      <h2 className={shared.heading}>Ajukan izin</h2>
      <input type="hidden" name="id" value={id} />
      <fieldset className={styles.kinds}>
        <legend className={shared.label}>Jenis izin</legend>
        {LEAVE_KINDS.map((each) => (
          <KindChoice key={each} kind={each} chosen={kind} onChoose={setKind} />
        ))}
      </fieldset>
      <div className={shared.form}>
        <TimeField
          label={isSkipping ? "Dari (tanggal dan jam)" : labels.start}
          name="startsAt"
          value={startsAt}
          onChange={setStartsAt}
        />
        <TimeField
          label={isSkipping ? "Sampai (tanggal dan jam)" : labels.end}
          name="endsAt"
          value={endsAt}
          onChange={setEndsAt}
        />
        {note && (
          <p
            className={`${styles.full} ${note.isProblem ? styles.warning : styles.note}`}
            role="status"
          >
            {note.words}
          </p>
        )}
        {kind === "special" && (
          <label className={`${shared.field} ${styles.field} ${styles.full}`}>
            Jenis keperluan
            <select name="specialReason" className={shared.input}>
              {SPECIAL_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {SPECIAL_REASON_WORDS[reason]}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className={`${shared.field} ${styles.field} ${styles.full}`}>
          Keperluan
          <textarea
            name="purpose"
            className={shared.input}
            maxLength={PURPOSE_MAX_LENGTH}
            placeholder={
              isSkipping
                ? "Jelaskan alasan tidak mengikuti kegiatan asrama"
                : "Jelaskan keperluan izin"
            }
          />
        </label>
        {!isSkipping && (
          <>
            <TextField
              label="Tujuan"
              name="destination"
              maxLength={DESTINATION_MAX_LENGTH}
              placeholder="Alamat atau kota tujuan"
            />
            <TextField
              label="Kontak yang bisa dihubungi"
              name="contact"
              maxLength={CONTACT_MAX_LENGTH}
              placeholder="Nomor orang tua atau wali"
            />
          </>
        )}
        <div className={`${shared.actions} ${styles.full}`}>
          <button type="submit" className={shared.button} disabled={pending}>
            Ajukan izin
          </button>
        </div>
        <div className={styles.full}>
          <FormMessage state={state} />
        </div>
      </div>
    </form>
  );
}
