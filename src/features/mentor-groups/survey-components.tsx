import shared from "@/ui/data-screen.module.css";
import { FAIR_FROM, GOOD_FROM } from "./evaluation-result";
import styles from "./mentor-groups.module.css";
import { SURVEY_STATEMENTS } from "./survey-statements";

/**
 * "Komponen evaluasi pengasuhan": the two parts of the result, how they
 * are joined, and the statements students rate.
 */
export function SurveyComponents() {
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Komponen evaluasi pengasuhan</h2>
      <ol className={shared.flow}>
        <li>
          <b>Capaian karakter mahasiswa</b>
          <span>
            Diambil otomatis oleh sistem dari rata-rata capaian karakter MEDALI
            anggota kelompok (hasil asesmen karakter terakhir).
          </span>
        </li>
        <li>
          <b>Umpan balik mahasiswa</b>
          <span>
            Rata-rata survei kepuasan yang diisi anggota kelompok di Profil saya
            selama periode dibuka. Skala 1–5 dikonversi ke 0–100 (skor ÷ 5 ×
            100).
          </span>
        </li>
        <li>
          <b>Nilai evaluasi</b>
          <span>
            Gabungan kedua komponen sesuai bobot periode. Baik ≥ {GOOD_FROM},
            Cukup {FAIR_FROM}–{GOOD_FROM - 1},9, Kurang &lt; {FAIR_FROM}. Hasil
            yang ditetapkan masuk ke riwayat evaluasi pengasuh dan dapat menjadi
            dasar penggantian.
          </span>
        </li>
      </ol>
      <details className={styles.folded}>
        <summary>Pernyataan survei ({SURVEY_STATEMENTS.length})</summary>
        <ol className={styles.statements}>
          {SURVEY_STATEMENTS.map((statement) => (
            <li key={statement}>{statement}</li>
          ))}
        </ol>
      </details>
    </section>
  );
}
