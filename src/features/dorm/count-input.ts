import { isDay } from "@/db/is-day";
import { isUuid } from "@/db/is-uuid";
import type { Parsed } from "@/parsed";
import { type CountMarks, NOTE_MAX_LENGTH } from "./count-ids";

/*
 * Read by the screen parts in the browser, so nothing here may take from
 * the database code.
 */

/** What "Simpan" or "Umumkan ketidakhadiran" asks for. */
export const COUNT_INTENTS = ["draft", "announce"] as const;

export type CountIntent = (typeof COUNT_INTENTS)[number];

/** A count as the form sends it. */
export interface SentCount {
  activityId: string;
  day: string;
  /** Which save of the count the form was opened on. */
  version: string;
  intent: string;
  /** The participants ticked Tidak hadir. */
  absentIds: string[];
  /** The participants with a Catatan, each beside their note. */
  noteIds: string[];
  noteTexts: string[];
}

export interface CountInput {
  activityId: string;
  day: string;
  /**
   * Which save of the count the form was opened on, counted from 1, or
   * `NOT_COUNTED_YET` for an activity that had no count then.
   */
  version: number;
  isAnnouncement: boolean;
  /** The participants absent or with a note; every other one is Hadir. */
  marks: CountMarks;
}

export const COUNT_INCOMPLETE = {
  ok: false,
  error: "Formulir ini tidak lengkap. Muat ulang halaman, lalu isi lagi.",
} as const;

/** The database keeps no text with this character. */
const NUL = "\u0000";
/** As many digits as the database keeps for a version. */
const VERSION = /^\d{1,9}$/;

function isIntent(sent: string): sent is CountIntent {
  return COUNT_INTENTS.some((intent) => intent === sent);
}

function noteFault(note: string): string | null {
  if (note.includes(NUL)) {
    return "Catatan memuat karakter yang tidak dapat disimpan. Ketik ulang catatan, lalu simpan lagi.";
  }
  if (note.length > NOTE_MAX_LENGTH) {
    return `Catatan paling panjang ${NOTE_MAX_LENGTH} karakter.`;
  }
  return null;
}

/** The ids, or null when one is not a key or is there twice. */
function distinctIds(ids: string[]): Set<string> | null {
  const seen = new Set<string>();
  for (const id of ids) {
    if (!isUuid(id) || seen.has(id)) return null;
    seen.add(id);
  }
  return seen;
}

/** The marks the form sends, or why they are refused. */
function readMarks(sent: SentCount): Parsed<CountMarks> {
  const absent = distinctIds(sent.absentIds);
  const noted = distinctIds(sent.noteIds);
  const isPaired = sent.noteIds.length === sent.noteTexts.length;
  if (absent === null || noted === null || !isPaired) return COUNT_INCOMPLETE;

  const marks: CountMarks = {};
  for (const id of absent) marks[id] = { isAbsent: true, note: "" };
  for (const [place, id] of sent.noteIds.entries()) {
    const note = (sent.noteTexts[place] ?? "").trim();
    const fault = noteFault(note);
    if (fault !== null) return { ok: false, error: fault };
    if (note === "") continue;
    marks[id] = { isAbsent: absent.has(id), note };
  }
  return { ok: true, value: marks };
}

/**
 * Checks a count as sent: the activity, the day and the version are what
 * the form holds, each participant is ticked or noted once, and a note
 * holds at most 200 characters. Whether the activity takes place that day
 * and has started, and whether each one named takes part, is decided
 * where the count is saved.
 */
export function parseCount(sent: SentCount): Parsed<CountInput> {
  const isWhole =
    isUuid(sent.activityId) &&
    isDay(sent.day) &&
    VERSION.test(sent.version) &&
    isIntent(sent.intent);
  if (!isWhole) return COUNT_INCOMPLETE;
  const marks = readMarks(sent);
  if (!marks.ok) return marks;
  return {
    ok: true,
    value: {
      activityId: sent.activityId,
      day: sent.day,
      version: Number(sent.version),
      isAnnouncement: sent.intent === "announce",
      marks: marks.value,
    },
  };
}
