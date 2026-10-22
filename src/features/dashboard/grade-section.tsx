import type { ReactNode } from "react";
import { passes } from "@/character-grades/grade-letter";
import { shownOneDecimal } from "@/character-grades/grade-words";
import {
  GRADE_LETTERS,
  GRADE_PARTS,
  type GradeScheme,
} from "@/character-grades/scheme-ids";
import shared from "@/ui/data-screen.module.css";
import { averageWords, TOO_FEW } from "./achievement-words";
import styles from "./dashboard.module.css";
import { GRADE_SECTION } from "./grade-card";
import type { CharacterGrades } from "./grade-read";
import type { ShownGrades } from "./grade-recap";
import {
  componentsNote,
  gradedLine,
  incompleteLine,
  NO_GRADES,
  partLabel,
} from "./grade-words";
import { SectionHead } from "./section-head";

/** The highest score of a part, the end of its bar. */
const PART_MAX = 100;

/**
 * "Komponen nilai karakter": the average of each part with its weight,
 * Rerata nilai akhir and the percent that meets the pass letter.
 */
function ComponentsPanel({
  recap,
  scheme,
}: {
  recap: ShownGrades;
  scheme: GradeScheme;
}) {
  return (
    <div className={shared.panel}>
      <div className={styles.panelHead}>
        <h3 className={shared.heading}>Komponen nilai karakter</h3>
        <span className={styles.caption}>rerata, bobot dalam kurung</span>
      </div>
      <ul className={styles.bars}>
        {GRADE_PARTS.map((part) => (
          <li key={part} className={styles.bar}>
            <span className={styles.barLabel}>
              {partLabel(part, scheme.weights)}
            </span>
            <meter
              className={`${styles.meter} ${styles[`${part}Meter`]}`}
              min={0}
              max={PART_MAX}
              value={recap.parts[part]}
              aria-label={partLabel(part, scheme.weights)}
            />
            <span className={styles.barValue}>
              {averageWords(recap.parts[part])}
            </span>
          </li>
        ))}
      </ul>
      <dl className={styles.facts}>
        <div>
          <dt>Rerata nilai akhir</dt>
          <dd>{shownOneDecimal(recap.meanFinal)}</dd>
        </div>
        <div>
          <dt>Memenuhi minimal {scheme.passLetter}</dt>
          <dd>{recap.passing}%</dd>
        </div>
      </dl>
      <p className={styles.note}>{componentsNote(recap)}</p>
    </div>
  );
}

/**
 * "Sebaran huruf": how many have each letter, each bar as long as its
 * share of the largest, and how many are "Belum lengkap".
 */
function LettersPanel({
  recap,
  scheme,
}: {
  recap: ShownGrades;
  scheme: GradeScheme;
}) {
  const largest = Math.max(1, ...Object.values(recap.letters));
  return (
    <div className={shared.panel}>
      <div className={styles.panelHead}>
        <h3 className={shared.heading}>Sebaran huruf</h3>
        <span className={styles.caption}>{gradedLine(recap)}</span>
      </div>
      <ul className={styles.bars}>
        {GRADE_LETTERS.map((letter) => {
          const passing = passes(letter, scheme.passLetter);
          return (
            <li key={letter} className={styles.bar}>
              <span className={styles.barLabel}>
                Huruf {letter}
                {!passing && (
                  <span className={styles.range}> (belum lulus)</span>
                )}
              </span>
              <meter
                className={`${styles.meter} ${passing ? styles.passMeter : styles.failMeter}`}
                min={0}
                max={largest}
                value={recap.letters[letter]}
                aria-label={`Huruf ${letter}`}
              />
              <span className={styles.barValue}>
                {recap.letters[letter].toLocaleString("id-ID")}
              </span>
            </li>
          );
        })}
      </ul>
      <p className={styles.note}>{incompleteLine(recap)}</p>
    </div>
  );
}

function GradePanels({ grades }: { grades: CharacterGrades }) {
  const { recap, scheme } = grades;
  if (recap.kind !== "shown") {
    return (
      <div className={shared.panel}>
        <p className={shared.empty}>
          {recap.kind === "none" ? NO_GRADES : TOO_FEW}
        </p>
      </div>
    );
  }
  return (
    <div className={styles.panels}>
      <ComponentsPanel recap={recap} scheme={scheme} />
      <LettersPanel recap={recap} scheme={scheme} />
    </div>
  );
}

/**
 * Section 2, Nilai karakter: the parts of the grade with their weights
 * and the letter spread, counts only, never a name. Without numbers it
 * says why. `detailAddress` leads to Penilaian karakter, for an account
 * that may open it; `children` is what the section holds below.
 */
export function GradeSection({
  grades,
  detailAddress,
  children,
}: {
  grades: CharacterGrades;
  detailAddress: string | null;
  children?: ReactNode;
}) {
  return (
    <section className={styles.section} aria-labelledby={GRADE_SECTION}>
      <SectionHead
        number={2}
        id={GRADE_SECTION}
        title="Nilai karakter"
        detailAddress={detailAddress}
      >
        Penilaian karakter KEP-220: kehadiran kegiatan, nilai pengasuhan, sikap
        dan perilaku (SIKU), dan nilai SKPM sesuai bobotnya.
      </SectionHead>
      <GradePanels grades={grades} />
      {children}
    </section>
  );
}
