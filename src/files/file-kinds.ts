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
