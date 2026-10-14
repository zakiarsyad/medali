"use client";

import { Fragment, useState, useTransition } from "react";
import { checkFileShape, MAX_FILE_ROWS } from "@/files/csv-file";
import shared from "@/ui/data-screen.module.css";
import { FileDrop } from "@/ui/file-drop";
import styles from "@/ui/file-upload.module.css";
import { previewSikuFileAction, saveSikuFileAction } from "./siku-actions";
import {
  SIKU_FILE_COLUMNS,
  SIKU_FILE_NOTE,
  SIKU_OPTIONAL_COLUMNS,
  SIKU_TEMPLATE_FILE_NAME,
  sikuTemplateCsv,
} from "./siku-file-columns";
import {
  SAVE_AGAIN,
  type SikuFilePreview,
  savedBeforeNote,
} from "./siku-file-preview";
import { SikuFilePreviewView } from "./siku-file-preview-view";

const TEMPLATE_LINK = `data:text/csv;charset=utf-8,${encodeURIComponent(sikuTemplateCsv())}`;

/** A picked file with what the server says it would do. */
interface Checked {
  /** The key made for the file, so a second press saves it once. */
  id: string;
  file: File;
  preview: SikuFilePreview;
}

function formWith(file: File): FormData {
  const form = new FormData();
  form.set("file", file);
  return form;
}

function ColumnNotes() {
  return (
    <p className={styles.uploadNote}>
      Satu baris per penambahan atau pengurangan. Kolom:{" "}
      {SIKU_FILE_COLUMNS.map(({ title }, place) => (
        <Fragment key={title}>
          {place > 0 && ", "}
          <b>{title}</b>
          {SIKU_OPTIONAL_COLUMNS.includes(title) && " (opsional)"}
        </Fragment>
      ))}
      . {SIKU_FILE_NOTE} Satu berkas paling banyak{" "}
      {MAX_FILE_ROWS.toLocaleString("id-ID")} baris dan 1 MB.
    </p>
  );
}

/** "Simpan (n) baris" and "Batal", with the confirm a file saved before needs. */
function SaveButtons({
  checked,
  saving,
  onSave,
  onCancel,
}: {
  checked: Checked;
  saving: boolean;
  onSave: (confirmRepeat: boolean) => void;
  onCancel: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const { savedOn, ready } = checked.preview;
  const needsConfirm = savedOn !== null && !confirmed;
  return (
    <>
      {savedOn !== null && (
        <div>
          <p className={`${styles.fileResult} ${styles.fileWarn}`} role="alert">
            {savedBeforeNote(savedOn)}
          </p>
          <label className={shared.role}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            {SAVE_AGAIN}
          </label>
        </div>
      )}
      <button
        type="button"
        className={shared.button}
        disabled={saving || needsConfirm}
        onClick={() => onSave(confirmed)}
      >
        {saving
          ? "Menyimpan…"
          : `Simpan ${ready.toLocaleString("id-ID")} baris`}
      </button>
      <button
        type="button"
        className={shared.quiet}
        disabled={saving}
        onClick={onCancel}
      >
        Batal
      </button>
    </>
  );
}

/**
 * "Unggah berkas" of "Input nilai SIKU": what the columns take, the
 * template, and the place to pick or drop a file. A picked file is
 * checked by the server and shown before anything is saved; "Simpan"
 * sends it again, with the key made for it, so a second press saves it
 * once.
 */
export function SikuUpload() {
  const [checked, setChecked] = useState<Checked | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [reading, startReading] = useTransition();
  const [saving, startSaving] = useTransition();

  function refuse(message: string) {
    setChecked(null);
    setDone(null);
    setError(message);
  }

  function pick(file: File) {
    const wrongShape = checkFileShape(file.name, file.size);
    if (wrongShape) return refuse(wrongShape);
    startReading(async () => {
      const preview = await previewSikuFileAction(formWith(file));
      if (!preview.ok) return refuse(preview.error);
      setError(null);
      setDone(null);
      setChecked({ id: crypto.randomUUID(), file, preview: preview.value });
    });
  }

  function save(sent: Checked, confirmRepeat: boolean) {
    const form = formWith(sent.file);
    form.set("id", sent.id);
    if (confirmRepeat) form.set("confirmRepeat", "yes");
    startSaving(async () => {
      const saved = await saveSikuFileAction(form);
      if (!saved.ok) return refuse(saved.error);
      setChecked(null);
      setError(null);
      setDone(saved.value);
    });
  }

  const busy = reading || saving;
  return (
    <>
      <ColumnNotes />
      <div className={shared.actions}>
        <a
          href={TEMPLATE_LINK}
          download={SIKU_TEMPLATE_FILE_NAME}
          className={shared.quiet}
        >
          Unduh templat CSV
        </a>
      </div>
      <FileDrop disabled={busy} onPick={pick} />
      {reading && (
        <p className={shared.detail} role="status">
          Membaca berkas…
        </p>
      )}
      {error && !reading && (
        <p className={`${styles.fileResult} ${styles.fileWarn}`} role="alert">
          {error}
        </p>
      )}
      {done && !reading && (
        <p className={styles.fileResult} role="status">
          {done}
        </p>
      )}
      {checked && !reading && (
        <SikuFilePreviewView name={checked.file.name} preview={checked.preview}>
          <SaveButtons
            key={checked.id}
            checked={checked}
            saving={saving}
            onSave={(confirmRepeat) => save(checked, confirmRepeat)}
            onCancel={() => setChecked(null)}
          />
        </SikuFilePreviewView>
      )}
    </>
  );
}
