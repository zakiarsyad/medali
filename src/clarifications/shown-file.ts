import { PDF } from "@/files/file-kinds";

/*
 * The file of a clarification as a card and the box over the page show
 * it. Read by the cards in the browser, so nothing here may take from
 * the database code.
 */

/** The file of a clarification, as far as its card and its box show it. */
export interface ClarificationFile {
  name: string;
  isPdf: boolean;
  /** What kind of file it is and how large, such as Dokumen PDF · 12 KB. */
  facts: string;
}

export const PDF_NOT_SHOWN =
  "Bila pratinjau tidak tampil, gunakan tombol Unduh.";

const KILOBYTE = 1024;

/** The kind of a file and its size, a small file counting as 1 KB. */
export function fileFacts(isPdf: boolean, bytes: number): string {
  const kind = isPdf ? "Dokumen PDF" : "Gambar";
  const size = Math.max(1, Math.round(bytes / KILOBYTE));
  return `${kind} · ${size.toLocaleString("id-ID")} KB`;
}

export function isPdfType(contentType: string): boolean {
  return contentType === PDF.contentType;
}

/** The file as its card shows it, from what is kept of it. */
export function shownFileOf(kept: {
  fileName: string;
  fileContentType: string;
  fileSize: number;
}): ClarificationFile {
  const isPdf = isPdfType(kept.fileContentType);
  return {
    name: kept.fileName,
    isPdf,
    facts: fileFacts(isPdf, kept.fileSize),
  };
}
