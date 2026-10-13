import type { FormEvent, ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import { ATTENDANCE_WORDS } from "./attendance-status";
import {
  RECORD_KIND_WORDS,
  RECORD_KINDS,
  RECORD_NOTE_MAX,
  type RecordActivity,
  type RecordKind,
} from "./manual-record";
import { chosenActivity, type RecordForm } from "./record-form-state";
import styles from "./verification.module.css";

export const RECORD_TITLE = "Catat kehadiran manual atau dispensasi";

function activityWords({ words, status }: RecordActivity): string {
  if (status === null) return words;
  return `${words} · ${ATTENDANCE_WORDS[status]}`;
}

/** What the list of activities says while it has none to choose from. */
function noActivityWords(form: RecordForm, busy: boolean): string {
  if (form.student === null) return "Pilih mahasiswa dulu";
  return busy ? "Memuat kegiatan…" : "Tidak ada kegiatan";
}

function ActivityField({
  form,
  busy,
  onChoose,
}: {
  form: RecordForm;
  busy: boolean;
  onChoose: (scheduleId: string) => void;
}) {
  const status = chosenActivity(form)?.status ?? null;
  return (
    <label className={shared.field}>
      Kegiatan
      <select
        className={shared.input}
        value={form.scheduleId}
        disabled={busy || form.activities.length === 0}
        onChange={(event) => onChoose(event.target.value)}
      >
        {form.activities.length === 0 && (
          <option value="">{noActivityWords(form, busy)}</option>
        )}
        {form.activities.map((activity) => (
          <option key={activity.id} value={activity.id}>
            {activityWords(activity)}
          </option>
        ))}
      </select>
      {status !== null && (
        <span className={shared.detail}>
          Status saat ini: {ATTENDANCE_WORDS[status]}.
        </span>
      )}
    </label>
  );
}

function isKind(value: string): value is RecordKind {
  return RECORD_KINDS.some((kind) => kind === value);
}

/**
 * The folded panel "Catat kehadiran manual atau dispensasi" as it is
 * drawn for one state of its form: the student, which `student` draws,
 * one of their activities that have started, with the status they have
 * there, what is recorded, the Keterangan and "Simpan". While something
 * is on its way every press is switched off.
 */
export function ManualRecordView({
  form,
  busy,
  student,
  onChoose,
  onKind,
  onNote,
  onSave,
}: {
  form: RecordForm;
  busy: boolean;
  /** The field that searches and picks the student. */
  student: ReactNode;
  onChoose: (scheduleId: string) => void;
  onKind: (kind: RecordKind) => void;
  onNote: (note: string) => void;
  onSave: () => void;
}) {
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave();
  }

  function chooseKind(value: string) {
    if (isKind(value)) onKind(value);
  }

  return (
    <details className={shared.panel}>
      <summary className={`${shared.heading} ${styles.foldHead}`}>
        {RECORD_TITLE}
      </summary>
      <p className={shared.detail}>
        Untuk mahasiswa yang hadir tetapi tidak bisa mengunggah foto, atau
        berhalangan dengan surat izin atau sakit. Dispensasi tidak dihitung
        dalam pembagi nilai kehadiran.
      </p>
      {/* noValidate: a missing Keterangan gets the app's own message. */}
      <form className={shared.form} onSubmit={send} noValidate>
        {student}
        <ActivityField form={form} busy={busy} onChoose={onChoose} />
        <label className={shared.field}>
          Status
          <select
            className={shared.input}
            value={form.kind}
            disabled={busy}
            onChange={(event) => chooseKind(event.target.value)}
          >
            {RECORD_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {RECORD_KIND_WORDS[kind]}
              </option>
            ))}
          </select>
        </label>
        <label className={`${shared.field} ${styles.wide}`}>
          Keterangan
          <input
            className={shared.input}
            placeholder="Misalnya nomor surat izin"
            maxLength={RECORD_NOTE_MAX}
            value={form.note}
            disabled={busy}
            onChange={(event) => onNote(event.target.value)}
          />
        </label>
        <FormMessage state={form.state} />
        <div className={shared.actions}>
          <button type="submit" className={shared.button} disabled={busy}>
            Simpan
          </button>
        </div>
      </form>
    </details>
  );
}
