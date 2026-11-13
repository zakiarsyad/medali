import type { Parsed } from "@/parsed";
import { NOTE_MAX_LENGTH } from "./companion-limits";

const NOTE_TOO_LONG = {
  ok: false,
  error: `Keterangan paling panjang ${NOTE_MAX_LENGTH} karakter.`,
} as const;

/** Checks a Keterangan as sent. An empty one is kept as none. */
export function parseCompanionNote(sent: string): Parsed<string | null> {
  const note = sent.trim();
  if (note.length > NOTE_MAX_LENGTH) return NOTE_TOO_LONG;
  return { ok: true, value: note === "" ? null : note };
}
