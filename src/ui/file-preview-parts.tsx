import { PREVIEW_SKIPPED } from "@/files/csv-file";
import shared from "./data-screen.module.css";
import styles from "./file-upload.module.css";

/** A row of an uploaded list that is skipped, with why. */
export interface SkippedFileRow {
  row: number;
  /** The NIM as the file has it, cut short, or empty. */
  nim: string;
  reason: string;
}

function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

/**
 * How many rows of a picked file are ready and how many skipped, and,
 * for a file that keeps the last row of a NIM, how many gave way to it.
 */
export function FileSummary({
  name,
  ready,
  skipped,
  duplicates = 0,
}: {
  name: string;
  ready: number;
  skipped: number;
  duplicates?: number;
}) {
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
      {duplicates > 0 &&
        `, ${shown(duplicates)} NIM ganda (dipakai baris terakhir)`}
      .
    </p>
  );
}

/** "dan (n) baris lainnya." under the first ready rows, when there are more. */
export function MoreRows({ more }: { more: number }) {
  if (more <= 0) return null;
  return <p className={shared.detail}>dan {shown(more)} baris lainnya.</p>;
}

/**
 * "Lihat baris yang dilewati": the first skipped rows with why. Nothing
 * when no row is skipped.
 */
export function SkippedRows({
  skipped,
  first,
}: {
  skipped: number;
  first: readonly SkippedFileRow[];
}) {
  if (skipped === 0) return null;
  return (
    <details className={styles.skipped}>
      <summary>Lihat baris yang dilewati</summary>
      <ul>
        {first.map(({ row, nim, reason }) => (
          <li key={row}>
            Baris {shown(row)}
            {nim && ` (${nim})`}: {reason}
          </li>
        ))}
      </ul>
      {skipped > PREVIEW_SKIPPED && (
        <p className={shared.detail}>
          Menampilkan {PREVIEW_SKIPPED} dari {shown(skipped)} baris yang
          dilewati.
        </p>
      )}
    </details>
  );
}
