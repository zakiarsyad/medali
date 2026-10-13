import styles from "./mentoring.module.css";

/** The line that tells a role which only reads who fills Pengasuhan in. */
export function ReadOnlyLine() {
  return (
    <p className={styles.readOnly}>
      Catatan pendampingan, daftar hadir pertemuan, dan nilai pengasuhan hanya
      diisi oleh pengasuh untuk anak asuhnya. Anda dapat melihat isian yang
      sudah dibuat pengasuh.
    </p>
  );
}
