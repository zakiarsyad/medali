import type { BadgeTone } from "@/ui/badge-tone";
import { toneBadge } from "@/ui/tone-badge";
import type { ScreeningLevel } from "./screening-ids";
import { LEVEL_WORDS, RISK_WORDS } from "./screening-words";

/** The colours of the prototype, from fine to most serious. */
const LEVEL_TONES: Record<ScreeningLevel, BadgeTone> = {
  normal: "good",
  mild: "plain",
  moderate: "warning",
  severe: "bad",
  extremely_severe: "bad",
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
      <span className={toneBadge(LEVEL_TONES[level])}>
        {LEVEL_WORDS[level]}
      </span>
      {risk && (
        <>
          {" "}
          <span className={toneBadge("bad")}>{RISK_WORDS}</span>
        </>
      )}
    </>
  );
}
