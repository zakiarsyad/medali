import type { ReactNode } from "react";
import {
  INDICATOR_MEANINGS,
  INDICATOR_SCORE_MAX,
  INDICATOR_SCORE_MIN,
} from "@/mentoring/score-indicators";
import shared from "@/ui/data-screen.module.css";
import type { IndicatorsInForce } from "./indicator-set";
import { INDICATORS_READ_ONLY, indicatorsNote } from "./indicator-words";
import styles from "./mentoring.module.css";

/** What each indicator score means, as "Panduan penilaian" shows its bands. */
function Meanings() {
  return (
    <div className={styles.rubric}>
      <b className={styles.chosen}>Arti nilai</b>
      <dl className={styles.bands}>
        {INDICATOR_MEANINGS.map(({ score, meaning }) => (
          <div key={score} className={styles.band}>
            <dt className={styles.bandRange}>{score}</dt>
            <dd className={styles.bandSentence}>{meaning}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * The panel "Indikator penilaian": its head, the indicators, what each
 * score means, who set the indicators last, and what comes under that.
 * `children` are the indicators: to read, or the boxes of Kepala Unit.
 * `end` is the line of a role that only reads, or the save of Kepala Unit.
 */
export function IndicatorFrame({
  set,
  children,
  end,
}: {
  set: IndicatorsInForce["set"];
  children: ReactNode;
  end: ReactNode;
}) {
  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <h2 className={shared.heading}>Indikator penilaian</h2>
        <span className={styles.quiet}>
          Skala {INDICATOR_SCORE_MIN}–{INDICATOR_SCORE_MAX}
        </span>
      </div>
      {children}
      <Meanings />
      <p className={styles.quiet}>{indicatorsNote(set)}</p>
      {end}
    </section>
  );
}

/** "Indikator penilaian" for a role that only reads it: each indicator, and who sets them. */
export function IndicatorPanel({ inForce }: { inForce: IndicatorsInForce }) {
  return (
    <IndicatorFrame
      set={inForce.set}
      end={<p className={styles.quiet}>{INDICATORS_READ_ONLY}</p>}
    >
      <ol className={styles.indicators}>
        {inForce.indicators.map((indicator) => (
          <li key={indicator.name} className={styles.indicator}>
            <b className={styles.chosen}>{indicator.name}</b>
            <span className={styles.bandSentence}>{indicator.sentence}</span>
          </li>
        ))}
      </ol>
    </IndicatorFrame>
  );
}
