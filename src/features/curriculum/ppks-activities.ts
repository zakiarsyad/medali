import { levelOf } from "@/academic-periods/stages";
import type { ValueKey } from "@/ui/medali-values";

/**
 * One activity as its list shows it: a PPKS one of a semester, or a
 * special or additional one.
 */
export interface PpksActivity {
  id: string;
  /** Null for a special or additional activity. */
  semester: number | null;
  name: string;
  valueKeys: ValueKey[];
  indicatorCodes: string[];
  /** Null while no target is set. */
  targetParticipants: number | null;
  isRequired: boolean;
  description: string;
  /** Tells one saved state of the activity from the next one. */
  version: string;
  /** How many of its schedules in Kegiatan karakter are not removed. */
  scheduledCount: number;
}

/**
 * The version of an activity last changed at that moment. Every change
 * sets a new moment, so a form opened before a change holds an old one.
 */
export function versionOf(changedAt: Date): string {
  return changedAt.toISOString();
}

/**
 * The moment a sent version stands for, or null when what was sent is not
 * a version this app made.
 */
export function momentOf(version: string): Date | null {
  const moment = new Date(version);
  if (Number.isNaN(moment.getTime())) return null;
  return versionOf(moment) === version ? moment : null;
}

/** The words of one list of activities and of its form. */
export interface ActivityWords {
  heading: string;
  addButton: string;
  /** The title of the form for a new activity. */
  newTitle: string;
  /** What the list says while it holds nothing. */
  empty: string;
}

const SPECIAL_WORDS: ActivityWords = {
  heading: "Kegiatan khusus dan tambahan",
  addButton: "Tambah kegiatan khusus",
  newTitle: "Kegiatan khusus atau tambahan",
  empty: "Belum ada kegiatan khusus atau tambahan.",
};

/**
 * The words for the PPKS activities of a semester, or for the special and
 * additional activities when there is no semester.
 */
export function wordsOf(semester: number | null): ActivityWords {
  if (semester === null) return SPECIAL_WORDS;
  return {
    heading: `Program kegiatan PPKS semester ${semester}`,
    addButton: "Tambah kegiatan PPKS",
    newTitle: `Kegiatan PPKS semester ${semester}`,
    empty: "Belum ada kegiatan PPKS untuk semester ini.",
  };
}

/**
 * What follows the tahap of a main indicator in the activity form: a mark
 * on the level of the form's semester. A special or additional activity
 * has no semester, so no level is marked.
 */
export function levelNote(level: number, semester: number | null): string {
  if (semester === null) return "";
  return level === levelOf(semester) ? " (level semester ini)" : "";
}

/** The small line under the name of an activity. */
export function activityNote(description: string, isRequired: boolean): string {
  const parts = [description, isRequired ? "" : "tidak wajib"];
  return parts.filter((part) => part !== "").join(" · ");
}

/**
 * The question asked before an activity is removed from the list. One
 * that is scheduled warns with how often, as its schedules stay.
 */
export function removalQuestion(name: string, scheduled: number): string {
  if (scheduled === 0) return `Hapus kegiatan "${name}" dari daftar?`;
  return `Kegiatan ini sudah dijadwalkan ${scheduled} kali. Tetap hapus dari daftar? Jadwal yang ada tidak ikut terhapus.`;
}

/** The list with the item taken out when it is in, and put in when not. */
export function toggled<Item>(list: readonly Item[], item: Item): Item[] {
  if (list.includes(item)) return list.filter((kept) => kept !== item);
  return [...list, item];
}

/** The ticked indicator codes that belong to a nilai still chosen. */
export function ticksOfValues(
  ticked: readonly string[],
  chosen: readonly string[],
): string[] {
  return ticked.filter((code) => chosen.includes(code.charAt(0)));
}
