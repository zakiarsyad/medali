"use client";

import { Fragment, useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { previewStudentFileAction } from "./actions";
import { FileDrop } from "./file-drop";
import type { FilePreview } from "./file-preview";
import { FilePreviewView } from "./file-preview-view";
import styles from "./new-students.module.css";
import {
  FILE_COLUMNS,
  MAX_FILE_ROWS,
  TEMPLATE_FILE_NAME,
  templateCsv,
} from "./student-file-columns";
import { checkFileShape } from "./uploaded-file";

const TEMPLATE_LINK = `data:text/csv;charset=utf-8,${encodeURIComponent(templateCsv())}`;

/** A picked file with what the server says it would do. */
interface Checked {
  file: File;
  preview: FilePreview;
}

function ColumnNotes() {
  return (
    <p className={styles.uploadNote}>
      Satu baris per mahasiswa. Kolom:{" "}
      {FILE_COLUMNS.map(({ title }, place) => (
        <Fragment key={title}>
          {place > 0 && ", "}
          <b>{title}</b>
        </Fragment>
      ))}
      . Prodi, provinsi, dan instansi harus sama dengan daftar di formulir.
      Jalur: Reguler atau Alih program. Jenis kelamin: L atau P. Kolom kategori
      diisi ya atau tidak. Status: Aktif, Cuti, atau Non Aktif. Satu berkas
      paling banyak {MAX_FILE_ROWS.toLocaleString("id-ID")} baris dan 1 MB.
    </p>
  );
}

export function StudentUpload() {
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
      const form = new FormData();
      form.set("file", file);
      const preview = await previewStudentFileAction(form);
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
          download={TEMPLATE_FILE_NAME}
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
        <FilePreviewView name={checked.file.name} preview={checked.preview}>
          <button
            type="button"
            className={shared.quiet}
            onClick={() => setChecked(null)}
          >
            Batal
          </button>
        </FilePreviewView>
      )}
    </>
  );
}
