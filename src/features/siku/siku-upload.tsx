"use client";

import { Fragment, useState, useTransition } from "react";
import { checkFileShape, MAX_FILE_ROWS } from "@/files/csv-file";
import shared from "@/ui/data-screen.module.css";
import { FileDrop } from "@/ui/file-drop";
import styles from "@/ui/file-upload.module.css";
import { previewSikuFileAction } from "./siku-actions";
import {
  SIKU_FILE_COLUMNS,
  SIKU_FILE_NOTE,
  SIKU_OPTIONAL_COLUMNS,
  SIKU_TEMPLATE_FILE_NAME,
  sikuTemplateCsv,
} from "./siku-file-columns";
import type { SikuFilePreview } from "./siku-file-preview";
import { SikuFilePreviewView } from "./siku-file-preview-view";

const TEMPLATE_LINK = `data:text/csv;charset=utf-8,${encodeURIComponent(sikuTemplateCsv())}`;

/** A picked file with what the server says it would do. */
interface Checked {
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

/**
 * "Unggah berkas" of "Input nilai SIKU": what the columns take, the
 * template, and the place to pick or drop a file. A picked file is
 * checked by the server and shown before anything is saved.
 */
export function SikuUpload() {
  const [checked, setChecked] = useState<Checked | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reading, startReading] = useTransition();

  function refuse(message: string) {
    setChecked(null);
    setError(message);
  }

  function pick(file: File) {
    const wrongShape = checkFileShape(file.name, file.size);
    if (wrongShape) return refuse(wrongShape);
    startReading(async () => {
      const preview = await previewSikuFileAction(formWith(file));
      if (!preview.ok) return refuse(preview.error);
      setError(null);
      setChecked({ file, preview: preview.value });
    });
  }

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
      <FileDrop disabled={reading} onPick={pick} />
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
      {checked && !reading && (
        <SikuFilePreviewView name={checked.file.name} preview={checked.preview}>
          <button
            type="button"
            className={shared.quiet}
            onClick={() => setChecked(null)}
          >
            Batal
          </button>
        </SikuFilePreviewView>
      )}
    </>
  );
}
