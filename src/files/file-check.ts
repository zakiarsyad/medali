import type { FileKind } from "./file-kinds";

/** A file as the browser sends it: nothing in it is trusted. */
export interface SentFile {
  name: string;
  bytes: Uint8Array;
}

/** Which files one kind of upload takes. */
export interface FileRule {
  kinds: readonly FileKind[];
  maxBytes: number;
}

export type FileFault = "wrong-kind" | "empty" | "too-large" | "wrong-content";

/** The kind a file name says it is, when the rule takes that kind. */
export function kindOf(name: string, rule: FileRule): FileKind | null {
  const lowered = name.toLowerCase();
  const kind = rule.kinds.find(({ extension }) => lowered.endsWith(extension));
  return kind ?? null;
}

/**
 * Checks the name and the size of a file before it is read: in the
 * browser, to answer at once, and again on the server. Gives what is
 * wrong, or null.
 */
export function shapeFault(
  name: string,
  byteCount: number,
  rule: FileRule,
): FileFault | null {
  if (!kindOf(name, rule)) return "wrong-kind";
  if (byteCount === 0) return "empty";
  if (byteCount > rule.maxBytes) return "too-large";
  return null;
}

/**
 * Checks a sent file whole: its name, its size, and that what it holds
 * is what its name says. Gives what is wrong, or null.
 */
export function fileFault(file: SentFile, rule: FileRule): FileFault | null {
  const wrongShape = shapeFault(file.name, file.bytes.length, rule);
  if (wrongShape) return wrongShape;
  if (!kindOf(file.name, rule)?.holds(file.bytes)) return "wrong-content";
  return null;
}
