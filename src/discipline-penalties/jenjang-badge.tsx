import type { BadgeTone } from "@/ui/badge-tone";
import { toneBadge } from "@/ui/tone-badge";
import {
  jenjangWords,
  type PenaltyCategory,
  type PenaltyLevel,
} from "./penalty-kinds";

/*
 * Read by the screen parts in the browser, so nothing here may take from
 * the database code.
 */

const CATEGORY_TONES: Record<PenaltyCategory, BadgeTone> = {
  light: "warning",
  medium: "bad",
  heavy: "severe",
};

/** "Ringan · jenjang pertama", in the colour of its Kategori. */
export function JenjangBadge({
  category,
  level,
}: {
  category: PenaltyCategory;
  level: PenaltyLevel;
}) {
  return (
    <span className={toneBadge(CATEGORY_TONES[category])}>
      {jenjangWords(category, level)}
    </span>
  );
}
