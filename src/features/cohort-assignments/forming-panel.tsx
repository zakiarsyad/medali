import shared from "@/ui/data-screen.module.css";
import styles from "./cohort-assignments.module.css";
import { FormingForm, type FormingStart } from "./forming-form";

/** "2. Bentuk kelompok". */
export function FormingPanel({
  cohortYear,
  start,
}: {
  cohortYear: number;
  start: FormingStart;
}) {
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>2. Bentuk kelompok</h2>
      {/* Made anew for each angkatan, so it shows that angkatan's choices. */}
      <FormingForm key={cohortYear} cohortYear={cohortYear} start={start} />
      <p className={styles.hint}>
        Kelompok dibentuk per program studi dan jalur. Metode seimbang menyebar
        putra, putri, dan asal provinsi secara merata.
      </p>
    </section>
  );
}
