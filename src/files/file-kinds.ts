/** A kind of file the app takes, told by its name and by what it holds. */
export interface FileKind {
  /** The end of the file name, in small letters, with its dot. */
  extension: string;
  contentType: string;
  /** Whether the bytes really are this kind, whatever the name says. */
  holds: (bytes: Uint8Array) => boolean;
}

/** A picture or a spreadsheet holds this; text never does. */
const NOT_TEXT = "\u0000";

export type ReadText =
  | { ok: true; text: string }
  | { ok: false; fault: "not-utf8" | "not-text" };

/** The text the bytes hold, refused when they do not hold text. */
export function readText(bytes: Uint8Array): ReadText {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return { ok: false, fault: "not-utf8" };
  }
  if (text.includes(NOT_TEXT)) return { ok: false, fault: "not-text" };
  return { ok: true, text };
}

export const CSV: FileKind = {
  extension: ".csv",
  contentType: "text/csv; charset=utf-8",
  holds: (bytes) => readText(bytes).ok,
};

/** Every JPEG picture starts with these three bytes. */
const JPEG_START = [0xff, 0xd8, 0xff];

function startsWith(bytes: Uint8Array, start: readonly number[]): boolean {
  return start.every((byte, place) => bytes[place] === byte);
}

export const JPEG: FileKind = {
  extension: ".jpg",
  contentType: "image/jpeg",
  holds: (bytes) => startsWith(bytes, JPEG_START),
};

/** Every PNG picture starts with these eight bytes. */
const PNG_START = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export const PNG: FileKind = {
  extension: ".png",
  contentType: "image/png",
  holds: (bytes) => startsWith(bytes, PNG_START),
};

/** Every PDF document starts with "%PDF-". */
const PDF_START = [0x25, 0x50, 0x44, 0x46, 0x2d];

export const PDF: FileKind = {
  extension: ".pdf",
  contentType: "application/pdf",
  holds: (bytes) => startsWith(bytes, PDF_START),
};
