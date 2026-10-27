import { STAGES } from "@/academic-periods/stages";
import { STARTING_TEXTS } from "@/ui/medali-starting-texts";
import { MEDALI_VALUES, type ValueKey } from "@/ui/medali-values";

export interface MainIndicator {
  /** The letter of the value and the level, such as M1. It never changes. */
  code: string;
  level: number;
  stage: string;
  text: string;
}

/** One MEDALI value with its four indicators, from level 1 to level 4. */
export interface ValueIndicators {
  key: ValueKey;
  name: string;
  indicators: MainIndicator[];
}

/**
 * The main indicators of every value. An indicator shows its saved text,
 * and its starting text while none is saved. `saved` holds texts by code.
 */
export function mainIndicators(
  saved: ReadonlyMap<string, string>,
): ValueIndicators[] {
  return MEDALI_VALUES.map(({ key, name }) => ({
    key,
    name,
    indicators: STAGES.map((stage, place) => {
      const code = `${key}${place + 1}`;
      const text = saved.get(code) ?? STARTING_TEXTS[key][place] ?? "";
      return { code, level: place + 1, stage, text };
    }),
  }));
}
