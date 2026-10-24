import type { BadgeTone } from "@/ui/badge-tone";
import { toneBadge } from "@/ui/tone-badge";
import type { CoachingLevel } from "./coaching-need";
import { COACHING_LEVEL_WORDS } from "./coaching-words";

const LEVEL_TONES: Record<CoachingLevel, BadgeTone> = {
  intensive: "severe",
  moderate: "warning",
  light: "plain",
};

/** The level of the coaching a student needs: Intensif, Sedang or Ringan. */
export function CoachingLevelBadge({ level }: { level: CoachingLevel }) {
  return (
    <span className={toneBadge(LEVEL_TONES[level])}>
      {COACHING_LEVEL_WORDS[level]}
    </span>
  );
}
