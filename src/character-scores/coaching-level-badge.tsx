import shared from "@/ui/data-screen.module.css";
import { toneBadge } from "@/ui/tone-badge";
import styles from "./character-scores.module.css";
import type { CoachingLevel } from "./coaching-need";
import { COACHING_LEVEL_WORDS } from "./coaching-words";

/** Intensif is shown stronger than the bad look, in solid red. */
const LEVEL_LOOKS: Record<CoachingLevel, string | undefined> = {
  intensive: `${shared.badge} ${styles.intensive}`,
  moderate: toneBadge("warning"),
  light: toneBadge("plain"),
};

/** The level of the coaching a student needs: Intensif, Sedang or Ringan. */
export function CoachingLevelBadge({ level }: { level: CoachingLevel }) {
  return (
    <span className={LEVEL_LOOKS[level]}>{COACHING_LEVEL_WORDS[level]}</span>
  );
}
