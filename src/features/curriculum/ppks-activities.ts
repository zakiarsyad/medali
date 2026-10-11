import type { ValueKey } from "@/ui/medali-values";

/** One PPKS activity of a semester, as the list shows it. */
export interface PpksActivity {
  id: string;
  semester: number;
  name: string;
  valueKeys: ValueKey[];
  indicatorCodes: string[];
  /** Null while no target is set. */
  targetParticipants: number | null;
  isRequired: boolean;
  description: string;
}

/** The small line under the name of an activity. */
export function activityNote(description: string, isRequired: boolean): string {
  const parts = [description, isRequired ? "" : "tidak wajib"];
  return parts.filter((part) => part !== "").join(" · ");
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
