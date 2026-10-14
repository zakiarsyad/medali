import shared from "@/ui/data-screen.module.css";
import styles from "./siku.module.css";

/** The title of "Input nilai SIKU", with how SIKU is reached. */
export function SikuInputTitle({ base }: { base: number }) {
  return (
    <div>
      <h2 className={shared.heading}>Input nilai SIKU</h2>
      <p className={styles.sub}>
        Semua mahasiswa mulai dari nilai dasar {base}. SIKU = {base} +
        penambahan − pengurangan.
      </p>
    </div>
  );
}
