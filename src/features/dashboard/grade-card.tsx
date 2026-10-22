import { passes } from "@/character-grades/grade-letter";
import { shownOneDecimal } from "@/character-grades/grade-words";
import { GRADE_LETTERS, type GradeLetter } from "@/character-grades/scheme-ids";
import { TOO_FEW } from "./achievement-words";
import styles from "./dashboard.module.css";
import type { CharacterGrades } from "./grade-read";
import type { ShownGrades } from "./grade-recap";
import { gradeCardLine, letterParts, NO_GRADES } from "./grade-words";

/** Where section 2 starts, for the card that leads to it. */
export const GRADE_SECTION = "nilai-karakter";

/** The colour of a letter: a shade of green by its place, or red below the pass letter. */
function letterClass(letter: GradeLetter, passLetter: GradeLetter) {
  if (!passes(letter, passLetter)) return styles.failPart;
  return styles[`pass${letter}Part`];
}

/**
 * A bar of the letters along the worked-out grades. Drawn as a picture,
 * so no width is written into the screen code; the counts in words are
 * its title.
 */
function LetterStack({
  recap,
  passLetter,
}: {
  recap: ShownGrades;
  passLetter: GradeLetter;
}) {
  const words = GRADE_LETTERS.map(
    (letter) => `Huruf ${letter} ${recap.letters[letter]}`,
  ).join(", ");
  return (
    <svg
      className={styles.stack}
      viewBox="0 0 100 1"
      preserveAspectRatio="none"
      role="img"
      aria-label={words}
    >
      <title>{words}</title>
      {letterParts(recap.letters, recap.graded).map((part) => (
        <rect
          key={part.letter}
          className={letterClass(part.letter, passLetter)}
          x={part.start}
          y={0}
          width={part.length}
          height={1}
        />
      ))}
    </svg>
  );
}

/**
 * The card "Nilai karakter": Rerata nilai akhir, the percent that meets
 * the pass letter, how many are held at 70, and the letter spread.
 * Pressing it moves the page to section 2. Without numbers it says why.
 */
export function GradeCard({ grades }: { grades: CharacterGrades }) {
  const { recap, scheme } = grades;
  return (
    <a className={styles.card} href={`#${GRADE_SECTION}`}>
      <span className={styles.cardHead}>
        <span className={styles.sectionNo}>2</span>
        Nilai karakter
      </span>
      {recap.kind === "none" && (
        <span className={styles.cardLine}>{NO_GRADES}</span>
      )}
      {recap.kind === "too_few" && (
        <span className={styles.cardLine}>{TOO_FEW}</span>
      )}
      {recap.kind === "shown" && (
        <>
          <span className={styles.cardValue}>
            {shownOneDecimal(recap.meanFinal)} <small>nilai akhir</small>
          </span>
          <span className={styles.cardLine}>
            {gradeCardLine(recap, scheme.passLetter)}
          </span>
          <LetterStack recap={recap} passLetter={scheme.passLetter} />
        </>
      )}
    </a>
  );
}
