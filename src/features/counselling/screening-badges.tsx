import shared from "@/ui/data-screen.module.css";
import styles from "./counselling.module.css";
import type { ScreeningLevel } from "./screening-ids";
import { LEVEL_WORDS, RISK_WORDS } from "./screening-words";

/** The colours of the prototype, from fine to most serious. */
const LEVEL_STYLES: Record<ScreeningLevel, string | undefined> = {
  normal: styles.ok,
  mild: styles.plain,
  moderate: styles.warn,
  severe: styles.bad,
  extremely_severe: styles.bad,
};

/** "Tingkat" of a screening, with "Risiko" beside it when self-harm was ticked. */
export function LevelBadges({
  level,
  risk,
}: {
  level: ScreeningLevel;
  risk: boolean;
}) {
  return (
    <>
      <span className={`${shared.badge} ${LEVEL_STYLES[level]}`}>
        {LEVEL_WORDS[level]}
      </span>
      {risk && (
        <>
          {" "}
          <span className={`${shared.badge} ${styles.bad}`}>{RISK_WORDS}</span>
        </>
      )}
    </>
  );
}
