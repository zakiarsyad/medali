import shared from "@/ui/data-screen.module.css";
import styles from "./curriculum.module.css";

export function BaseScorePanel({
  score,
  note,
  mayChange,
}: {
  score: number;
  /** Who set the score last, or that it is the starting one. */
  note: string;
  mayChange: boolean;
}) {
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Nilai dasar SIKU</h2>
      <p className={shared.detail}>
        Nilai awal sikap dan perilaku (SIKU) yang sama untuk semua mahasiswa
        sebelum penambahan dan pengurangan. {note}
      </p>
      <div className={styles.scoreRow}>
        <label className={shared.field}>
          Nilai dasar (0–100)
          <input
            name="score"
            type="number"
            min={0}
            max={100}
            className={shared.input}
            defaultValue={score}
            disabled={!mayChange}
          />
        </label>
        <span className={shared.detail}>
          SIKU akhir = nilai dasar + penambahan − pengurangan, dibatasi 0–100.
        </span>
      </div>
    </section>
  );
}
