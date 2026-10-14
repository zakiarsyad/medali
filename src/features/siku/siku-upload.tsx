"use client";

import { Fragment, useState } from "react";
import { checkFileShape, MAX_FILE_ROWS } from "@/files/csv-file";
import shared from "@/ui/data-screen.module.css";
import { FileDrop } from "@/ui/file-drop";
import styles from "@/ui/file-upload.module.css";
import {
  SIKU_FILE_COLUMNS,
  SIKU_FILE_NOTE,
  SIKU_OPTIONAL_COLUMNS,
  SIKU_TEMPLATE_FILE_NAME,
  sikuTemplateCsv,
} from "./siku-file-columns";

const TEMPLATE_LINK = `data:text/csv;charset=utf-8,${encodeURIComponent(sikuTemplateCsv())}`;

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
 * template, and the place to pick or drop a file.
 */
export function SikuUpload() {
  const [error, setError] = useState<string | null>(null);

  function pick(file: File) {
    setError(checkFileShape(file.name, file.size));
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
      <FileDrop disabled={false} onPick={pick} />
      {error && (
        <p className={`${styles.fileResult} ${styles.fileWarn}`} role="alert">
          {error}
        </p>
      )}
    </>
  );
}
