import { sourceName } from "./csv-file";
import type { SentFile } from "./file-check";
import { fingerprintOf } from "./file-fingerprint";

/** What an upload keeps of its file: the name as shown, and a fingerprint. */
export interface UploadMark {
  fileName: string;
  fingerprint: string;
}

/** The mark of a sent file. Two files with the same mark hold the same rows. */
export function uploadMarkOf(file: SentFile): UploadMark {
  return {
    fileName: sourceName(file.name),
    fingerprint: fingerprintOf(file.bytes),
  };
}
