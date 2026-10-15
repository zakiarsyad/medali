import { createHash } from "node:crypto";

/**
 * The SHA-256 fingerprint of a file's bytes, in hex: two files with the
 * same fingerprint hold the same content. Kept with an upload in place of
 * the file itself.
 */
export function fingerprintOf(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}
