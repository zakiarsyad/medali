import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import { type FilePreview, PREVIEW_SKIPPED } from "./file-preview";
import styles from "./new-students.module.css";
import { FILE_COLUMNS } from "./student-file-columns";

function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

function Summary({ name, preview }: { name: string; preview: FilePreview }) {
  const { ready, skipped, repeated } = preview;
  return (
    <p
      className={
        skipped > 0
          ? `${styles.fileResult} ${styles.fileWarn}`
          : styles.fileResult
      }
      role="status"
    >
      <b>{name}</b>: {shown(ready)} baris siap disimpan
      {skipped > 0 && `, ${shown(skipped)} baris dilewati`}
      {repeated > 0 &&
        `, ${shown(repeated)} NIM ganda (dipakai baris terakhir)`}
      .
    </p>
  );
}

function ReadyRows({ preview }: { preview: FilePreview }) {
  const more = preview.ready - preview.firstRows.length;
  return (
    <>
      <div className={shared.tableWrap}>
        <table className={shared.table}>
          <thead>
            <tr>
              {FILE_COLUMNS.map(({ title }) => (
                <th key={title}>{title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.firstRows.map((cells) => (
              <tr key={cells[0]}>
                {FILE_COLUMNS.map(({ title }, place) => (
                  <td key={title}>{cells[place]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {more > 0 && (
        <p className={shared.detail}>dan {shown(more)} baris lainnya.</p>
      )}
    </>
  );
}

function SkippedRows({ preview }: { preview: FilePreview }) {
  return (
    <details className={styles.skipped}>
      <summary>Lihat baris yang dilewati</summary>
      <ul>
        {preview.firstSkipped.map(({ row, nim, reason }) => (
          <li key={row}>
            Baris {shown(row)}
            {nim && ` (${nim})`}: {reason}
          </li>
        ))}
      </ul>
      {preview.skipped > PREVIEW_SKIPPED && (
        <p className={shared.detail}>
          Menampilkan {PREVIEW_SKIPPED} dari {shown(preview.skipped)} baris yang
          dilewati.
        </p>
      )}
    </details>
  );
}

/**
 * What a picked file would do, before anything is saved. `children` are
 * the buttons, shown only when there is a row to save.
 */
export function FilePreviewView({
  name,
  preview,
  children,
}: {
  name: string;
  preview: FilePreview;
  children: ReactNode;
}) {
  return (
    <>
      <Summary name={name} preview={preview} />
      {preview.ready > 0 && <ReadyRows preview={preview} />}
      {preview.skipped > 0 && <SkippedRows preview={preview} />}
      {preview.ready > 0 && <div className={shared.actions}>{children}</div>}
    </>
  );
}
