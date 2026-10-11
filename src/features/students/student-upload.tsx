import { Fragment } from "react";
import shared from "@/ui/data-screen.module.css";
import styles from "./new-students.module.css";
import {
  FILE_COLUMNS,
  MAX_FILE_ROWS,
  TEMPLATE_FILE_NAME,
  templateCsv,
} from "./student-file-columns";

const TEMPLATE_LINK = `data:text/csv;charset=utf-8,${encodeURIComponent(templateCsv())}`;

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
    </>
  );
}
