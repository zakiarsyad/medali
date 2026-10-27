"use client";

import { Fragment, useState, useTransition } from "react";
import { checkFileShape, MAX_FILE_ROWS } from "@/files/csv-file";
import shared from "@/ui/data-screen.module.css";
import { FileDrop } from "@/ui/file-drop";
import { FileSaveButtons } from "@/ui/file-save-buttons";
import styles from "@/ui/file-upload.module.css";
import { ModeSwitch } from "@/ui/mode-switch";
import { saveAgainNote } from "@/ui/repeated-file";
import { refusedResult, sentOr } from "@/ui/save-not-sent";
import skpmStyles from "./skpm.module.css";
import { previewSkpmFileAction, saveSkpmFileAction } from "./skpm-actions";
import {
  SKPM_FILE_COLUMNS,
  SKPM_FILE_NOTE,
  SKPM_TEMPLATE_FILE_NAME,
  skpmTemplateCsv,
} from "./skpm-file-columns";
import type { SkpmFilePreview } from "./skpm-file-preview";
import { SkpmFilePreviewView } from "./skpm-file-preview-view";
import type { SkpmUploadMode } from "./skpm-ids";
import { MODE_CHOICES, MODE_NOTES, REPLACE_QUESTION } from "./skpm-words";

const TEMPLATE_LINK = `data:text/csv;charset=utf-8,${encodeURIComponent(skpmTemplateCsv())}`;

/** A picked file with what the server says it would do. */
interface Checked {
  /** The key made for the file, so a second press saves it once. */
  id: string;
  file: File;
  preview: SkpmFilePreview;
}

function formWith(file: File): FormData {
  const form = new FormData();
  form.set("file", file);
  return form;
}

function ColumnNotes({ mode }: { mode: SkpmUploadMode }) {
  return (
    <p className={styles.uploadNote}>
      {MODE_NOTES[mode]} Satu baris per kegiatan; satu mahasiswa boleh punya
      banyak baris. Bila hanya punya rekap, isi satu baris per mahasiswa dengan
      kegiatan "Rekap poin semester". Kolom:{" "}
      {SKPM_FILE_COLUMNS.map(({ title }, place) => (
        <Fragment key={title}>
          {place > 0 && ", "}
          <b>{title}</b>
        </Fragment>
      ))}
      . {SKPM_FILE_NOTE} Satu berkas paling banyak{" "}
      {MAX_FILE_ROWS.toLocaleString("id-ID")} baris dan 1 MB.
    </p>
  );
}

/**
 * "Simpan (n) baris" and "Batal". In "Tambahkan" a file saved before
 * waits for its confirm; "Ganti semua data" never asks, as it replaces
 * every upload before it.
 */
export function SkpmSaveButtons({
  preview,
  mode,
  saving,
  onSave,
  onCancel,
}: {
  preview: SkpmFilePreview;
  mode: SkpmUploadMode;
  saving: boolean;
  onSave: (confirmRepeat: boolean) => void;
  onCancel: () => void;
}) {
  const warning =
    mode === "add" && preview.savedOn !== null
      ? saveAgainNote(preview.savedOn)
      : null;
  return (
    <FileSaveButtons
      ready={preview.ready}
      warning={warning}
      saving={saving}
      onSave={onSave}
      onCancel={onCancel}
    />
  );
}

/**
 * "Unggah data SKPM": "Tambahkan" or "Ganti semua data", what the
 * columns take, the template, and the place to pick or drop a file. A
 * picked file is checked by the server and shown before anything is
 * saved; "Simpan" sends it again, with the key made for it, so a second
 * press saves it once. "Ganti semua data" asks first.
 */
export function SkpmUpload() {
  const [mode, setMode] = useState<SkpmUploadMode>("add");
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
      const preview = await previewSkpmFileAction(formWith(file));
      if (!preview.ok) return refuse(preview.error);
      setError(null);
      setDone(null);
      setChecked({ id: crypto.randomUUID(), file, preview: preview.value });
    });
  }

  function save(sent: Checked, confirmRepeat: boolean) {
    if (mode === "replace" && !window.confirm(REPLACE_QUESTION)) return;
    const form = formWith(sent.file);
    form.set("id", sent.id);
    form.set("mode", mode);
    if (confirmRepeat) form.set("confirmRepeat", "yes");
    startSaving(async () => {
      const saved = await sentOr(() => saveSkpmFileAction(form), refusedResult);
      if (!saved.ok) return refuse(saved.error);
      setChecked(null);
      setError(null);
      setDone(saved.value);
    });
  }

  const busy = reading || saving;
  return (
    <section className={shared.panel}>
      <div className={skpmStyles.panelHead}>
        <h2 className={shared.heading}>Unggah data SKPM</h2>
        <ModeSwitch
          legend="Cara input"
          modes={MODE_CHOICES}
          mode={mode}
          onChoose={setMode}
        />
      </div>
      <ColumnNotes mode={mode} />
      <div className={shared.actions}>
        <a
          href={TEMPLATE_LINK}
          download={SKPM_TEMPLATE_FILE_NAME}
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
        <SkpmFilePreviewView name={checked.file.name} preview={checked.preview}>
          <SkpmSaveButtons
            key={checked.id}
            preview={checked.preview}
            mode={mode}
            saving={saving}
            onSave={(confirmRepeat) => save(checked, confirmRepeat)}
            onCancel={() => setChecked(null)}
          />
        </SkpmFilePreviewView>
      )}
    </section>
  );
}
