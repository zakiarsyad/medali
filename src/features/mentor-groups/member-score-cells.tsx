import { rerataOf, type Scores } from "@/character-scores/assessment-score";
import { PredicateBadge } from "@/character-scores/predicate-badge";
import { NOT_ASSESSED } from "@/character-scores/predicate-words";
import { shownRerata } from "@/character-scores/shown-rerata";
import shared from "@/ui/data-screen.module.css";
import { MEDALI_VALUES } from "@/ui/medali-values";
import styles from "./mentor-groups.module.css";

/** The six values, Rerata and Predikat. */
const SCORE_COLUMNS = MEDALI_VALUES.length + 2;

/** The titles of the columns of a member's latest assessment. */
export function ScoreHeads() {
  return (
    <>
      {MEDALI_VALUES.map(({ key, name }) => (
        <th key={key}>
          <abbr title={name}>{key}</abbr>
        </th>
      ))}
      <th>Rerata</th>
      <th>Predikat</th>
    </>
  );
}

/** A member's latest six scores, Rerata and predikat, or "Belum diasesmen". */
export function ScoreCells({ scores }: { scores: Scores | null }) {
  if (scores === null) {
    return (
      <td colSpan={SCORE_COLUMNS} data-title="Asesmen">
        <span className={shared.badge}>{NOT_ASSESSED}</span>
      </td>
    );
  }
  const rerata = rerataOf(scores);
  return (
    <>
      {MEDALI_VALUES.map(({ key, name }) => (
        <td key={key} data-title={name}>
          {scores[key]}
        </td>
      ))}
      <td className={styles.strong} data-title="Rerata">
        {shownRerata(rerata)}
      </td>
      <td data-title="Predikat">
        <PredicateBadge rerata={rerata} />
      </td>
    </>
  );
}
