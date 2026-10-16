"use client";

import { Fragment, useState } from "react";
import { isDay } from "@/db/is-day";
import { checkFileShape, MAX_FILE_ROWS } from "@/files/csv-file";
import shared from "@/ui/data-screen.module.css";
import { FileDrop } from "@/ui/file-drop";
import styles from "@/ui/file-upload.module.css";
import own from "./fitness.module.css";
import {
  FITNESS_FILE_COLUMNS,
  FITNESS_FILE_NOTE,
  FITNESS_TEMPLATE_FILE_NAME,
  fitnessTemplateCsv,
} from "./fitness-file-columns";
import { DAY_IN_FUTURE } from "./fitness-input";

const TEMPLATE_LINK = `data:text/csv;charset=utf-8,${encodeURIComponent(fitnessTemplateCsv())}`;

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
 * or drop a file.
 */
export function FitnessUpload({ today }: { today: string }) {
  const [testedOn, setTestedOn] = useState(today);
  const [error, setError] = useState<string | null>(null);

  function pick(file: File) {
    setError(checkFileShape(file.name, file.size));
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
      <FileDrop disabled={false} onPick={pick} />
      {error && (
        <p className={`${styles.fileResult} ${styles.fileWarn}`} role="alert">
          {error}
        </p>
      )}
    </>
  );
}
