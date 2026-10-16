"use client";

import { Fragment, useState, useTransition } from "react";
import { isDay } from "@/db/is-day";
import { checkFileShape, MAX_FILE_ROWS } from "@/files/csv-file";
import shared from "@/ui/data-screen.module.css";
import { FileDrop } from "@/ui/file-drop";
import styles from "@/ui/file-upload.module.css";
import own from "./fitness.module.css";
import { previewFitnessFileAction } from "./fitness-actions";
import {
  FITNESS_FILE_COLUMNS,
  FITNESS_FILE_NOTE,
  FITNESS_TEMPLATE_FILE_NAME,
  fitnessTemplateCsv,
} from "./fitness-file-columns";
import type { FitnessFilePreview } from "./fitness-file-preview";
import { FitnessFilePreviewView } from "./fitness-file-preview-view";
import { DAY_IN_FUTURE } from "./fitness-input";

const TEMPLATE_LINK = `data:text/csv;charset=utf-8,${encodeURIComponent(fitnessTemplateCsv())}`;

/** A picked file with what the server says it would do. */
interface Checked {
  file: File;
  preview: FitnessFilePreview;
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
      {FITNESS_FILE_COLUMNS.map(({ title }, place) => (
        <Fragment key={title}>
          {place > 0 && ", "}
          <b>{title}</b>
        </Fragment>
      ))}
      . {FITNESS_FILE_NOTE} Satu berkas paling banyak{" "}
      {MAX_FILE_ROWS.toLocaleString("id-ID")} baris dan 1 MB.
    </p>
  );
}

/** "Tanggal tes", picked once for every row of the file. */
function TestDayPick({
  testedOn,
  today,
  onChange,
}: {
  testedOn: string;
  today: string;
  onChange: (day: string) => void;
}) {
  const isFuture = isDay(testedOn) && testedOn > today;
  return (
    <div className={shared.form}>
      <label className={shared.field}>
        Tanggal tes
        <input
          type="date"
          className={shared.input}
          max={today}
          value={testedOn}
          onChange={(event) => onChange(event.target.value)}
        />
        {isFuture && <span className={own.fault}>{DAY_IN_FUTURE}</span>}
      </label>
    </div>
  );
}

/**
 * "Unggah berkas" of "Input hasil tes kebugaran": what the columns take,
 * "Tanggal tes" of the whole file, the template, and the place to pick
 * or drop a file. A picked file is checked by the server and shown, with
 * the category each score gives, before anything is saved.
 */
export function FitnessUpload({ today }: { today: string }) {
  const [testedOn, setTestedOn] = useState(today);
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
      const preview = await previewFitnessFileAction(formWith(file));
      if (!preview.ok) return refuse(preview.error);
      setError(null);
      setChecked({ file, preview: preview.value });
    });
  }

  return (
    <>
      <ColumnNotes />
      <TestDayPick testedOn={testedOn} today={today} onChange={setTestedOn} />
      <div className={shared.actions}>
        <a
          href={TEMPLATE_LINK}
          download={FITNESS_TEMPLATE_FILE_NAME}
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
        <FitnessFilePreviewView
          name={checked.file.name}
          preview={checked.preview}
        >
          <button
            type="button"
            className={shared.quiet}
            onClick={() => setChecked(null)}
          >
            Batal
          </button>
        </FitnessFilePreviewView>
      )}
    </>
  );
}
