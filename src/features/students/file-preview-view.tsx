import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import { type FilePreview, PREVIEW_SKIPPED } from "./file-preview";
import styles from "./new-students.module.css";
import { FILE_COLUMNS } from "./student-file-columns";

function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

function skippedIn(preview: FilePreview): number {
  return preview.broken + preview.registered;
}

function Summary({ name, preview }: { name: string; preview: FilePreview }) {
  const { ready, broken, registered, repeated } = preview;
  return (
    <p
      className={
        skippedIn(preview) > 0
          ? `${styles.fileResult} ${styles.fileWarn}`
          : styles.fileResult
      }
      role="status"
    >
      <b>{name}</b>: {shown(ready)} baris siap disimpan
      {broken > 0 &&
        `, ${shown(broken)} baris dilewati karena isinya perlu diperbaiki`}
      {registered > 0 &&
        `, ${shown(registered)} baris dilewati karena NIM sudah terdaftar`}
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

/**
 * The skipped rows with why: first those to correct in the file, then
 * those whose NIM is already registered. Nothing when no row is skipped.
 */
export function SkippedRows({
  preview,
  open = false,
}: {
  preview: FilePreview;
  open?: boolean;
}) {
  const skipped = skippedIn(preview);
  if (skipped === 0) return null;
  return (
    <details className={styles.skipped} open={open}>
      <summary>Lihat baris yang dilewati</summary>
      <ul>
        {preview.firstSkipped.map(({ row, nim, reason }) => (
          <li key={row}>
            Baris {shown(row)}
            {nim && ` (${nim})`}: {reason}
          </li>
        ))}
      </ul>
      {skipped > PREVIEW_SKIPPED && (
        <p className={shared.detail}>
          Menampilkan {PREVIEW_SKIPPED} dari {shown(skipped)} baris yang
          dilewati, yang perlu diperbaiki lebih dulu.
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
      <SkippedRows preview={preview} />
      {preview.ready > 0 && <div className={shared.actions}>{children}</div>}
    </>
  );
}
