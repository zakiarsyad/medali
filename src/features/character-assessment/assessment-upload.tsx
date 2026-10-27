"use client";

import { Fragment, useState, useTransition } from "react";
import { checkFileShape, MAX_FILE_ROWS } from "@/files/csv-file";
import shared from "@/ui/data-screen.module.css";
import { FileDrop } from "@/ui/file-drop";
import styles from "@/ui/file-upload.module.css";
import { NOT_SENT_RESULT, sentOr } from "@/ui/save-not-sent";
import {
  previewAssessmentFileAction,
  saveAssessmentFileAction,
} from "./assessment-actions";
import {
  ASSESSMENT_FILE_COLUMNS,
  ASSESSMENT_FILE_NOTE,
  ASSESSMENT_TEMPLATE_FILE_NAME,
  assessmentTemplateCsv,
} from "./assessment-file-columns";
import type { AssessmentFilePreview } from "./assessment-file-preview";
import { AssessmentFilePreviewView } from "./assessment-file-preview-view";
import { ASSESSMENT_SOURCES } from "./assessment-ids";
import { SourceOptions } from "./source-options";

const TEMPLATE_LINK = `data:text/csv;charset=utf-8,${encodeURIComponent(assessmentTemplateCsv())}`;

/** A picked file with what the server says it would do. */
interface Checked {
  /** The key made for the file, so a second press saves it once. */
  id: string;
  file: File;
  preview: AssessmentFilePreview;
}

function formWith(file: File): FormData {
  const form = new FormData();
  form.set("file", file);
  return form;
}

function ColumnNotes() {
  return (
    <p className={styles.uploadNote}>
      Satu baris per mahasiswa. Kolom:{" "}
      {ASSESSMENT_FILE_COLUMNS.map(({ title }, place) => (
        <Fragment key={title}>
          {place > 0 && ", "}
          <b>{title}</b>
        </Fragment>
      ))}
      . {ASSESSMENT_FILE_NOTE} Satu berkas paling banyak{" "}
      {MAX_FILE_ROWS.toLocaleString("id-ID")} baris dan 1 MB.
    </p>
  );
}

/** "Sumber asesmen", picked once for every row of the file. */
function SourcePick({
  source,
  onChange,
}: {
  source: string;
  onChange: (source: string) => void;
}) {
  return (
    <div className={shared.form}>
      <label className={shared.field}>
        Sumber asesmen
        <select
          className={shared.input}
          value={source}
          onChange={(event) => onChange(event.target.value)}
        >
          <SourceOptions />
        </select>
      </label>
    </div>
  );
}

/** "Simpan (n) baris" and "Batal". */
function SaveButtons({
  ready,
  saving,
  onSave,
  onCancel,
}: {
  ready: number;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <button
        type="button"
        className={shared.button}
        disabled={saving}
        onClick={onSave}
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
 * "Unggah berkas" of "Input capaian MEDALI": what the columns take, the
 * source of the whole file, the template, and the place to pick or drop
 * a file. A picked file is checked by the server and shown before
 * anything is saved; "Simpan" sends it again, with the key made for it,
 * so a second press saves it once.
 */
export function AssessmentUpload() {
  const [source, setSource] = useState<string>(ASSESSMENT_SOURCES[0]);
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
      const preview = await previewAssessmentFileAction(formWith(file));
      if (!preview.ok) return refuse(preview.error);
      setError(null);
      setDone(null);
      setChecked({ id: crypto.randomUUID(), file, preview: preview.value });
    });
  }

  function save(sent: Checked) {
    const form = formWith(sent.file);
    form.set("id", sent.id);
    form.set("source", source);
    startSaving(async () => {
      const saved = await sentOr(
        () => saveAssessmentFileAction(form),
        NOT_SENT_RESULT,
      );
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
      <SourcePick source={source} onChange={setSource} />
      <div className={shared.actions}>
        <a
          href={TEMPLATE_LINK}
          download={ASSESSMENT_TEMPLATE_FILE_NAME}
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
        <AssessmentFilePreviewView
          name={checked.file.name}
          preview={checked.preview}
        >
          <SaveButtons
            ready={checked.preview.ready}
            saving={saving}
            onSave={() => save(checked)}
            onCancel={() => setChecked(null)}
          />
        </AssessmentFilePreviewView>
      )}
    </>
  );
}
