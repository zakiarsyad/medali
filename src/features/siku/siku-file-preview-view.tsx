import type { ReactNode } from "react";
import { PREVIEW_SKIPPED } from "@/files/csv-file";
import shared from "@/ui/data-screen.module.css";
import styles from "@/ui/file-upload.module.css";
import type { SikuFilePreview } from "./siku-file-preview";
import { KIND_WORDS, REASON_WORDS, signedPoints } from "./siku-words";

function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

function Summary({
  name,
  preview,
}: {
  name: string;
  preview: SikuFilePreview;
}) {
  const { ready, skipped } = preview;
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
      {skipped > 0 && `, ${shown(skipped)} baris dilewati`}.
    </p>
  );
}

/** The first ready rows, in a box that scrolls sideways on a phone. */
function ReadyRows({ preview }: { preview: SikuFilePreview }) {
  const more = preview.ready - preview.firstRows.length;
  return (
    <>
      <div className={shared.tableWrap}>
        <table className={shared.table}>
          <thead>
            <tr>
              <th>nim</th>
              <th>nama</th>
              <th>jenis</th>
              <th>alasan</th>
              <th>poin</th>
              <th>keterangan</th>
            </tr>
          </thead>
          <tbody>
            {preview.firstRows.map((row) => (
              <tr key={row.row}>
                <td>{row.nim}</td>
                <td>
                  <span className={shared.typed}>{row.name}</span>
                </td>
                <td>{KIND_WORDS[row.kind]}</td>
                <td>{REASON_WORDS[row.reason]}</td>
                <td>{signedPoints(row.points, row.kind)}</td>
                <td>
                  <span className={shared.typed}>{row.keterangan}</span>
                </td>
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

/** The skipped rows with why. Nothing when no row is skipped. */
function SkippedRows({ preview }: { preview: SikuFilePreview }) {
  if (preview.skipped === 0) return null;
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
 * What a picked SIKU file would do, before anything is saved. `children`
 * are the buttons, shown only when there is a row to save.
 */
export function SikuFilePreviewView({
  name,
  preview,
  children,
}: {
  name: string;
  preview: SikuFilePreview;
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
