import {
  type FileFault,
  type FileRule,
  fileFault,
  kindOf,
  type SentFile,
} from "./file-check";
import type { FileStore } from "./file-store";

export type KeptFile =
  | { ok: true; key: string; contentType: string }
  | { ok: false; fault: FileFault };

/**
 * The one way a sent file gets into the file storage: checked against the
 * rule first, then kept under a new key inside `folder`. The key says
 * nothing about the file or its owner. A refused file is not kept.
 */
export async function keepFile(
  store: FileStore,
  folder: string,
  file: SentFile,
  rule: FileRule,
): Promise<KeptFile> {
  const fault = fileFault(file, rule);
  if (fault) return { ok: false, fault };
  const kind = kindOf(file.name, rule);
  if (!kind) return { ok: false, fault: "wrong-kind" };

  const key = `${folder}/${crypto.randomUUID()}`;
  await store.put(key, { bytes: file.bytes, contentType: kind.contentType });
  return { ok: true, key, contentType: kind.contentType };
}
