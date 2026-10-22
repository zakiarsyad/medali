import shared from "@/ui/data-screen.module.css";
import styles from "./character-scores.module.css";
import type { CoachingLevel } from "./coaching-need";
import { COACHING_LEVEL_WORDS } from "./coaching-words";

const LEVEL_LOOKS: Record<CoachingLevel, string | undefined> = {
  intensive: styles.intensive,
  moderate: styles.moderate,
  light: styles.light,
};

/** The level of the coaching a student needs: Intensif, Sedang or Ringan. */
export function CoachingLevelBadge({ level }: { level: CoachingLevel }) {
  return (
    <span className={`${shared.badge} ${LEVEL_LOOKS[level]}`}>
      {COACHING_LEVEL_WORDS[level]}
    </span>
  );
}
