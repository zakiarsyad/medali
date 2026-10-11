import shared from "@/ui/data-screen.module.css";
import styles from "./curriculum.module.css";

const SCALE = [
  {
    name: "Emas",
    dot: styles.emas,
    range: "85–100",
    meaning: "Nilai sudah menjadi kebiasaan dan menginspirasi orang lain.",
  },
  {
    name: "Perak",
    dot: styles.perak,
    range: "75–84",
    meaning: "Nilai tampak konsisten dalam perilaku sehari-hari.",
  },
  {
    name: "Perunggu",
    dot: styles.perunggu,
    range: "65–74",
    meaning: "Nilai mulai tampak, tetapi belum konsisten.",
  },
  {
    name: "Perlu pembinaan",
    dot: styles.bina,
    range: "di bawah 65",
    meaning: "Perlu pendampingan terarah melalui program pembinaan.",
  },
];

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
