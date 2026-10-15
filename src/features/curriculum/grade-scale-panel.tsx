import {
  type Predicate,
  predicateOf,
} from "@/character-scores/assessment-score";
import { shownRerata } from "@/character-scores/shown-rerata";
import shared from "@/ui/data-screen.module.css";
import styles from "./curriculum.module.css";

interface Grade {
  predicate: Predicate;
  name: string;
  /** The class of the dot in the colour of the predikat. */
  dot: string | undefined;
  range: string;
  meaning: string;
}

const SCALE: Grade[] = [
  {
    predicate: "gold",
    name: "Emas",
    dot: styles.emas,
    range: "85–100",
    meaning: "Nilai sudah menjadi kebiasaan dan menginspirasi orang lain.",
  },
  {
    predicate: "silver",
    name: "Perak",
    dot: styles.perak,
    range: "75–84",
    meaning: "Nilai tampak konsisten dalam perilaku sehari-hari.",
  },
  {
    predicate: "bronze",
    name: "Perunggu",
    dot: styles.perunggu,
    range: "65–74",
    meaning: "Nilai mulai tampak, tetapi belum konsisten.",
  },
  {
    predicate: "guidance",
    name: "Perlu pembinaan",
    dot: styles.bina,
    range: "di bawah 65",
    meaning: "Perlu pendampingan terarah melalui program pembinaan.",
  },
];

/**
 * An average score to one decimal, with the dot of its predikat in the
 * colours of the Skala predikat MEDALI, and the predikat's name for a
 * screen reader.
 */
export function GradedScore({ score }: { score: number }) {
  const predicate = predicateOf(score);
  const grade = SCALE.find((candidate) => candidate.predicate === predicate);
  return (
    <span className={styles.grade}>
      <i className={`${styles.dot} ${grade?.dot}`} />
      {shownRerata(score)}
      <span className={shared.hidden}>, {grade?.name}</span>
    </span>
  );
}

export function GradeScalePanel() {
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Skala predikat MEDALI</h2>
      <div className={shared.tableWrap}>
        <table className={shared.table}>
          <thead>
            <tr>
              <th>Predikat</th>
              <th>Rentang skor</th>
              <th>Makna</th>
            </tr>
          </thead>
          <tbody>
            {SCALE.map((grade) => (
              <tr key={grade.name}>
                <td>
                  <span className={styles.grade}>
                    <i className={`${styles.dot} ${grade.dot}`} />
                    {grade.name}
                  </span>
                </td>
                <td>{grade.range}</td>
                <td>{grade.meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
