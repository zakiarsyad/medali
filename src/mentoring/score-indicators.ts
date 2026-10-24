import { STARTING_TEXTS } from "@/ui/medali-starting-texts";
import { MEDALI_VALUES } from "@/ui/medali-values";

/** How many indicators a mentoring score is given on. Each weighs the same. */
export const INDICATOR_COUNT = 6;

/** The most characters the name and the sentence of an indicator may hold. */
export const NAME_MAX = 50;
export const SENTENCE_MAX = 200;

/** One indicator of the mentoring score: its name and the sentence that explains it. */
export interface ScoreIndicator {
  name: string;
  sentence: string;
}

/**
 * The indicators in force until Kepala Unit sets them: the six MEDALI
 * values, each with the text its first-level main indicator starts with
 * in Kurikulum.
 */
export const STARTING_INDICATORS: readonly ScoreIndicator[] = MEDALI_VALUES.map(
  ({ key, name }) => ({ name, sentence: STARTING_TEXTS[key][0] }),
);
