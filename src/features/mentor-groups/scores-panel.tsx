import { Medal } from "@/character-scores/medal";
import { PredicateBadge } from "@/character-scores/predicate-badge";
import { NOT_ASSESSED } from "@/character-scores/predicate-words";
import { shownRerata } from "@/character-scores/shown-rerata";
import shared from "@/ui/data-screen.module.css";
import styles from "./mentor-groups.module.css";
import { PredicateBar } from "./predicate-bar";
import type { ScoreSummary } from "./score-averages";

/**
 * The medal of the averages of each MEDALI value, over the assessment
 * before as a dashed line, beside the Rerata with its predikat. With
 * nobody assessed it shows "-" and no medal.
 */
export function ScoresPanel({
  title,
  summary,
  withBar,
}: {
  /** "Rerata kelompok" or "Rerata binaan". */
  title: string;
  summary: ScoreSummary | null;
  /** Whether a bar shows how many members hold each predikat. */
  withBar: boolean;
}) {
  return (
    <section className={shared.panel}>
      <div className={styles.scores}>
        {summary && (
          <div className={styles.scoresMedal}>
            <Medal scores={summary.values} last={summary.earlier} />
          </div>
        )}
        <div className={styles.scoresFigure}>
          <span className={styles.quiet}>{title}</span>
          <b className={styles.figure}>
            {shownRerata(summary?.rerata ?? null)}
          </b>
          {summary ? (
            <PredicateBadge rerata={summary.rerata} />
          ) : (
            <span className={shared.badge}>{NOT_ASSESSED}</span>
          )}
          {withBar && summary && <PredicateBar counts={summary.predicates} />}
        </div>
      </div>
    </section>
  );
}
