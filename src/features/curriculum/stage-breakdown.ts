import { MEDALI_VALUES, type ValueKey } from "@/ui/medali-values";
import { STARTING_VERSION } from "./saved-version";
import { STARTING_BREAKDOWNS } from "./starting-breakdowns";

/** What one nilai means at one tahap. */
export interface Breakdown {
  text: string;
  /** The names of the kegiatan acuan. */
  activities: string[];
  /** The codes of the main indicators chosen for the tahap. */
  indicatorCodes: string[];
}

/** A breakdown as kept or as it starts, with what tells one save from the next. */
export interface VersionedBreakdown extends Breakdown {
  /** What a form opened on this breakdown sends back with its save. */
  version: string;
}

export interface ValueBreakdown extends VersionedBreakdown {
  key: ValueKey;
  name: string;
}

/** The breakdown of one tahap as the screen shows it. */
export interface TahapBreakdown {
  tahapNo: number;
  values: ValueBreakdown[];
  /** Who changed the tahap last, or that it holds the starting content. */
  note: string;
}

/** The codes of the four main indicators of one nilai, from level 1 to 4. */
export function codesOf(key: ValueKey): string[] {
  return [1, 2, 3, 4].map((level) => `${key}${level}`);
}

function startingBreakdown(tahapNo: number, key: ValueKey): VersionedBreakdown {
  const start = STARTING_BREAKDOWNS[tahapNo - 1]?.[key];
  return {
    text: start?.[1] ?? "",
    activities: start ? [start[0]] : [],
    indicatorCodes: [`${key}${tahapNo}`],
    version: STARTING_VERSION,
  };
}

/**
 * The breakdown of every nilai at one tahap. A nilai shows its saved
 * content, and its starting content while none is saved: one kegiatan
 * acuan, and the main indicator of the tahap's own level.
 */
export function stageBreakdown(
  tahapNo: number,
  saved: ReadonlyMap<ValueKey, VersionedBreakdown>,
): ValueBreakdown[] {
  return MEDALI_VALUES.map(({ key, name }) => ({
    key,
    name,
    ...(saved.get(key) ?? startingBreakdown(tahapNo, key)),
  }));
}
