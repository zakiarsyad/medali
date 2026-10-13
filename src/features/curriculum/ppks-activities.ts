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
}

/**
 * The version of an activity last changed at that moment. Every change
 * sets a new moment, so a form opened before a change holds an old one.
 */
export function versionOf(changedAt: Date): string {
  return changedAt.toISOString();
}

/** The small line under the name of an activity. */
export function activityNote(description: string, isRequired: boolean): string {
  const parts = [description, isRequired ? "" : "tidak wajib"];
  return parts.filter((part) => part !== "").join(" · ");
}

/** The question asked before an activity is removed from the list. */
export function removalQuestion(name: string): string {
  return `Hapus kegiatan "${name}" dari daftar?`;
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
