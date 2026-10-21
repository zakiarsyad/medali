import type { Predicate } from "./assessment-score";
import styles from "./character-scores.module.css";
import { spreadParts, spreadWords } from "./spread-parts";

/**
 * A bar of how many students have each predikat, each part in the colour
 * of its predikat. Drawn as a picture, so no width is written into the
 * screen code; the words of the spread are its title.
 */
export function SpreadBar({ spread }: { spread: Record<Predicate, number> }) {
  const words = `Sebaran predikat: ${spreadWords(spread)}`;
  return (
    <svg
      className={styles.spread}
      viewBox="0 0 100 1"
      preserveAspectRatio="none"
      role="img"
      aria-label={words}
    >
      <title>{words}</title>
      {spreadParts(spread).map((part) => (
        <rect
          key={part.predicate}
          className={styles[`${part.predicate}Part`]}
          x={part.start}
          y={0}
          width={part.length}
          height={1}
        />
      ))}
    </svg>
  );
}
