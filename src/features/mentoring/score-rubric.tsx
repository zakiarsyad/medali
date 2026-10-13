import styles from "./mentoring.module.css";
import { bandRange, SCORE_BANDS } from "./score-bands";

/** "Panduan penilaian": each band of scores with what it says of a mentee. */
export function ScoreRubric() {
  return (
    <div className={styles.rubric}>
      <b className={styles.chosen}>Panduan penilaian</b>
      <dl className={styles.bands}>
        {SCORE_BANDS.map((band) => (
          <div key={band.from} className={styles.band}>
            <dt className={styles.bandRange}>{bandRange(band)}</dt>
            <dd className={styles.bandSentence}>{band.sentence}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
