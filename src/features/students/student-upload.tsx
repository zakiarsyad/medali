"use client";

import { Fragment, useState, useTransition } from "react";
import { checkFileShape, MAX_FILE_ROWS } from "@/files/csv-file";
import shared from "@/ui/data-screen.module.css";
import { FileDrop } from "@/ui/file-drop";
import styles from "@/ui/file-upload.module.css";
import {
  previewStudentFileAction,
  type SavedFileShown,
  saveStudentFileAction,
} from "./actions";
import type { FilePreview } from "./file-preview";
import { FilePreviewView, SkippedRows } from "./file-preview-view";
import {
  FILE_COLUMNS,
  OPTIONAL_COLUMNS,
  TEMPLATE_FILE_NAME,
  templateCsv,
  yearRange,
} from "./student-file-columns";
import { useNotify } from "./student-notice";

const TEMPLATE_LINK = `data:text/csv;charset=utf-8,${encodeURIComponent(templateCsv())}`;

/** A picked file with what the server says it would do. */
interface Checked {
  file: File;
  preview: FilePreview;
}

function formWith(file: File): FormData {
  const form = new FormData();
  form.set("file", file);
  return form;
}

function ColumnNotes({ cohortYears }: { cohortYears: number[] }) {
  return (
    <p className={styles.uploadNote}>
      Satu baris per mahasiswa. Kolom:{" "}
      {FILE_COLUMNS.map(({ title }, place) => (
        <Fragment key={title}>
          {place > 0 && ", "}
          <b>{title}</b>
          {OPTIONAL_COLUMNS.includes(title) && " (opsional)"}
        </Fragment>
      ))}
      . Prodi, provinsi, dan instansi harus sama dengan daftar di formulir.
      Jalur: Reguler atau Alih program. Jenis kelamin: L atau P. Angkatan:{" "}
      {yearRange(cohortYears)}. Kolom kategori diisi ya atau tidak. Status:
      Aktif, Cuti, atau Non Aktif. Email: alamat email kampus mahasiswa, boleh
      dikosongkan. Satu berkas paling banyak{" "}
      {MAX_FILE_ROWS.toLocaleString("id-ID")} baris dan 1 MB.
    </p>
  );
}

/** The message of a save, with the rows of the file that were skipped. */
function SavedFile({ saved }: { saved: SavedFileShown }) {
  return (
    <>
      <p className={styles.fileResult} role="status">
        {saved.message}
      </p>
      <SkippedRows preview={saved.preview} open />
    </>
  );
}

export function StudentUpload({
  cohortYears,
}: {
  /** The Angkatan choices of the form, which a file must keep to. */
  cohortYears: number[];
}) {
  const [checked, setChecked] = useState<Checked | null>(null);
  const [saved, setSaved] = useState<SavedFileShown | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reading, startReading] = useTransition();
  const [saving, startSaving] = useTransition();
  const notify = useNotify();

  function refuse(message: string) {
    setChecked(null);
    setSaved(null);
    setError(message);
  }

  function pick(file: File) {
    const wrongShape = checkFileShape(file.name, file.size);
    if (wrongShape) return refuse(wrongShape);
    notify(null);
    startReading(async () => {
      const preview = await previewStudentFileAction(formWith(file));
      if (!preview.ok) return refuse(preview.error);
      setError(null);
      setSaved(null);
      setChecked({ file, preview: preview.value });
    });
  }

  function save(file: File) {
    notify(null);
    startSaving(async () => {
      const result = await saveStudentFileAction(formWith(file));
      if (!result.ok) return refuse(result.error);
      setChecked(null);
      setSaved(result.value);
    });
  }

  return (
    <>
      <ColumnNotes cohortYears={cohortYears} />
      <div className={shared.actions}>
        <a
          href={TEMPLATE_LINK}
          download={TEMPLATE_FILE_NAME}
          className={shared.quiet}
        >
          Unduh templat CSV
        </a>
      </div>
      <FileDrop disabled={reading || saving} onPick={pick} />
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
      {saved && !reading && <SavedFile saved={saved} />}
      {checked && !reading && (
        <FilePreviewView name={checked.file.name} preview={checked.preview}>
          <button
            type="button"
            className={shared.button}
            disabled={saving}
            onClick={() => save(checked.file)}
          >
            {saving
              ? "Menyimpan…"
              : `Simpan ${checked.preview.ready.toLocaleString("id-ID")} baris`}
          </button>
          <button
            type="button"
            className={shared.quiet}
            disabled={saving}
            onClick={() => setChecked(null)}
          >
            Batal
          </button>
        </FilePreviewView>
      )}
    </>
  );
}
